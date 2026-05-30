/**
 * WealthOS — App Error Boundary
 * 
 * Catches unhandled React errors and displays a premium dark fallback UI
 * instead of crashing the app. All errors are logged locally only.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/styles/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Local-only memory logging. Kept on device, never sent to any server.
    console.warn('WealthOS Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The math engine encountered an anomaly. Your data is safe —
            everything is stored locally on your device.
          </Text>
          <Text style={styles.errorDetail}>
            {this.state.errorMessage}
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={this.handleReload}
            activeOpacity={0.7}
          >
            <Text style={styles.reloadButtonText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.backgroundStart,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    color: ThemeColors.neonAmber,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  errorDetail: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.base,
  },
  reloadButton: {
    backgroundColor: ThemeColors.frostedPanel,
    borderWidth: 1,
    borderColor: ThemeColors.neonAmber,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  reloadButtonText: {
    color: ThemeColors.neonAmber,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
  },
});

export default AppErrorBoundary;
