/**
 * WealthOS — Forecast Chart Component
 * 
 * Displays the Monte Carlo percentile fan chart:
 * - 90th percentile (best case) — green
 * - 50th percentile (median) — cyan
 * - 10th percentile (worst case) — amber
 * 
 * Uses react-native-gifted-charts for lightweight rendering.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import { formatINRCompact } from '@/math/engine';
import { MonteCarloResult } from '@/types';

interface ForecastChartProps {
  data: MonteCarloResult;
}

export default function ForecastChart({ data }: ForecastChartProps) {
  // Use a sensible default layout width, then measure natively
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get('window').width - 64
  );

  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  const yAxisLabelWidth = 55;
  const rightShift = 10;
  // Dynamic chart grid width centered inside container
  const chartWidth = Math.max(100, containerWidth - yAxisLabelWidth - rightShift - 10);

  // Prepare chart data
  const p90Data = useMemo(
    () =>
      data.percentile90.map((val, i) => ({
        value: val,
        year: data.yearLabels[i],
        labelComponent:
          i % 5 === 0 ? () => (
            <View style={styles.xAxisLabelContainer}>
              <Text style={styles.xAxisLabelText}>
                {data.yearLabels[i]}
              </Text>
            </View>
          ) : undefined,
      })),
    [data]
  );

  const p50Data = useMemo(
    () =>
      data.percentile50.map((val, i) => ({
        value: val,
        year: data.yearLabels[i],
      })),
    [data]
  );

  const p10Data = useMemo(
    () =>
      data.percentile10.map((val, i) => ({
        value: val,
        year: data.yearLabels[i],
      })),
    [data]
  );

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.neonGreen }]} />
          <Text style={styles.legendText}>Best (90th%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.neonCyan }]} />
          <Text style={styles.legendText}>Median (50th%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.neonAmber }]} />
          <Text style={styles.legendText}>Worst (10th%)</Text>
        </View>
      </View>

      {/* Chart */}
      <View onLayout={onContainerLayout} style={styles.chartWrapper}>
        <LineChart
          data={p90Data}
          data2={p50Data}
          data3={p10Data}
          height={200}
          width={chartWidth}
          spacing={chartWidth / (data.percentile90.length - 1 || 1)}
          color1={ThemeColors.neonGreen}
          color2={ThemeColors.neonCyan}
          color3={ThemeColors.neonAmber}
          thickness={2}
          hideDataPoints
          curved
          curvature={0.2}
          xAxisColor={ThemeColors.borderLight}
          yAxisColor={ThemeColors.borderLight}
          xAxisLabelTextStyle={styles.xAxisLabel}
          yAxisTextStyle={styles.yAxisLabel}
          backgroundColor="transparent"
          rulesColor={ThemeColors.borderLight}
          rulesType="dashed"
          noOfSections={4}
          yAxisLabelWidth={yAxisLabelWidth}
          formatYLabel={(val: string) => formatINRCompact(Number(val))}
          xAxisLabelsVerticalShift={5}
          areaChart
          startFillColor1="rgba(57, 255, 20, 0.12)"
          endFillColor1="rgba(57, 255, 20, 0.01)"
          startFillColor2="rgba(0, 255, 255, 0.08)"
          endFillColor2="rgba(0, 255, 255, 0.01)"
          startFillColor3="rgba(255, 165, 0, 0.06)"
          endFillColor3="rgba(255, 165, 0, 0.01)"
          isAnimated
          animationDuration={800}
          pointerConfig={{
            pointerStripUptoDataPoint: false,
            pointerStripColor: 'rgba(255, 255, 255, 0.25)',
            pointerStripWidth: 1.5,
            strokeDashArray: [4, 4],
            pointerColor: ThemeColors.neonCyan,
            pointerLabelWidth: 140,
            pointerLabelHeight: 85,
            pointerVanishDelay: 2500,
            pointerLabelComponent: (items: any[]) => {
              if (!items || items.length === 0) return null;
              const year = items[0]?.year || 'Forecast';
              const p90Val = items[0]?.value || 0;
              const p50Val = items[1]?.value || 0;
              const p10Val = items[2]?.value || 0;

              return (
                <View style={styles.tooltipContainer}>
                  <Text style={styles.tooltipYear}>{year}</Text>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: ThemeColors.neonGreen }]} />
                    <Text style={styles.tooltipLabel}>Best:</Text>
                    <Text style={[styles.tooltipValue, { color: ThemeColors.neonGreen }]}>
                      {formatINRCompact(p90Val)}
                    </Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: ThemeColors.neonCyan }]} />
                    <Text style={styles.tooltipLabel}>Expected:</Text>
                    <Text style={[styles.tooltipValue, { color: ThemeColors.neonCyan }]}>
                      {formatINRCompact(p50Val)}
                    </Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: ThemeColors.neonAmber }]} />
                    <Text style={styles.tooltipLabel}>Worst:</Text>
                    <Text style={[styles.tooltipValue, { color: ThemeColors.neonAmber }]}>
                      {formatINRCompact(p10Val)}
                    </Text>
                  </View>
                </View>
              );
            },
          }}
        />
      </View>

      {/* Summary values */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: ThemeColors.neonAmber }]}>
            {formatINRCompact(data.percentile10[data.percentile10.length - 1])}
          </Text>
          <Text style={styles.summaryLabel}>Worst Case</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: ThemeColors.neonCyan }]}>
            {formatINRCompact(data.percentile50[data.percentile50.length - 1])}
          </Text>
          <Text style={styles.summaryLabel}>Expected</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: ThemeColors.neonGreen }]}>
            {formatINRCompact(data.percentile90[data.percentile90.length - 1])}
          </Text>
          <Text style={styles.summaryLabel}>Best Case</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  chartWrapper: {
    width: '100%',
    overflow: 'visible',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
  },
  xAxisLabel: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.semibold,
    width: 60,
    textAlign: 'center',
    marginLeft: -30, // Centers label container underneath its vertical grid mark
  },
  xAxisLabelContainer: {
    width: 60,
    marginLeft: -25, // Shift left to center the 60px wide label container
    alignItems: 'center',
    justifyContent: 'center',
  },
  xAxisLabelText: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.semibold,
  },
  yAxisLabel: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.semibold,
    textAlign: 'right',
  },
  tooltipContainer: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(15, 17, 22, 0.95)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    width: 140,
    top: -55,
    left: -70,
  },
  tooltipYear: {
    color: ThemeColors.textPrimary,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 2,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  tooltipLabel: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    flex: 1,
  },
  tooltipValue: {
    fontSize: 9,
    fontWeight: Typography.weight.semibold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },
  summaryLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    marginTop: 2,
  },
});
