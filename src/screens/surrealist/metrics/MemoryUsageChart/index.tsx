import { ChartTooltip } from "@mantine/charts";
import { format } from "date-fns";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useCloudMetricsQuery } from "~/cloud/queries/metrics";
import { useStable } from "~/hooks/stable";
import { formatMemory } from "~/util/helpers";
import { BaseAreaChart, CommonAreaChartProps } from "../BaseAreaChart";

export function MemoryUsageChart({
	instance,
	duration,
	height,
	nodeFilter,
	onCalculateMetricsNodes,
}: CommonAreaChartProps) {
	const { data: metrics, isPending } = useCloudMetricsQuery(instance, "memory", duration);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Results in infinite loop
	useEffect(() => {
		if (metrics) {
			onCalculateMetricsNodes?.(metrics);
		}
	}, [metrics]);

	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const series = data
		.filter((dat) => nodeFilter === undefined || nodeFilter.includes(dat.labels))
		.map((metric) => ({
			name: metric.labels,
			color: "surreal",
			label: `Memory usage (${metric.labels})`,
		}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			time: dayjs(timestamp).valueOf(),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = Math.round(data / 1000000);
			}
		}

		return value;
	});

	const tooltip = useStable(({ label, payload }) => {
		return (
			<ChartTooltip
				label={label ? format(label as number, "MMMM d, yyyy - h:mm a") : label}
				payload={payload}
				series={series}
				valueFormatter={(value: number) => formatMemory(value)}
			/>
		);
	});

	return (
		<BaseAreaChart
			isLoading={isPending}
			title="Memory usage"
			information="The amount of memory used by the instance in megabytes"
			duration={duration}
			values={values}
			series={series}
			tooltip={tooltip}
			height={height}
			yAxisTickFormatter={(value) => formatMemory(value as number, true)}
		/>
	);
}
