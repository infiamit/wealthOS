/**
 * WealthOS — Snapshot Screen (Manual Offline Ledger)
 * 
 * Zero-friction, privacy-first monthly ledger for manual asset entry.
 * All data stored locally in MMKV. No databases, no cloud sync.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { GlassPanel } from '@/components/GlassPanel';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import { getAssets, saveAssets, addAsset } from '@/services/storage';
import { formatINR, calculateNetWorth, calculateWeightedCagr } from '@/math/engine';
import { AssetClass, AssetCategory } from '@/types';

// Category config
const CATEGORY_CONFIG: Record<AssetCategory, { emoji: string; color: string }> = {
  EQUITY: { emoji: '🟢', color: ThemeColors.equityGreen },
  DEBT: { emoji: '🔵', color: ThemeColors.debtBlue },
  CASH: { emoji: '⚪', color: ThemeColors.cashWhite },
  GOLD: { emoji: '🟡', color: ThemeColors.goldYellow },
  LIABILITY: { emoji: '🔴', color: ThemeColors.liabilityRed },
};

export default function SnapshotScreen() {
  const insets = useSafeAreaInsets();
  const [assets, setAssets] = useState<AssetClass[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editCagr, setEditCagr] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loaded = getAssets();
    setAssets(loaded);
  }, []);

  const netWorth = calculateNetWorth(assets);
  const weightedCagr = calculateWeightedCagr(assets);

  // ============================================================
  // HANDLERS
  // ============================================================
  const startEditing = useCallback((asset: AssetClass) => {
    setEditingId(asset.id);
    setEditName(asset.name);
    setEditValue(asset.value.toString());
    setEditCagr(asset.customExpectedCagr.toString());
  }, []);

  const saveActiveRow = useCallback(() => {
    if (!editingId) return;

    const parsedValue = parseFloat(editValue.replace(/[^0-9.]/g, '')) || 0;
    const parsedCagr = parseFloat(editCagr.replace(/[^0-9.]/g, '')) || 0;

    setAssets((prev) =>
      prev.map((a) =>
        a.id === editingId
          ? { ...a, name: editName, value: parsedValue, customExpectedCagr: parsedCagr }
          : a
      )
    );
    setHasChanges(true);
    setEditingId(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [editingId, editName, editValue, editCagr]);

  const cancelActiveRow = useCallback(() => {
    setEditingId(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSave = useCallback(() => {
    saveAssets(assets);
    setHasChanges(false);
    setEditingId(null);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [assets]);

  const handleAddAsset = useCallback(() => {
    const newAsset: AssetClass = {
      id: `custom_${Date.now()}`,
      name: 'New Asset',
      value: 0,
      customExpectedCagr: 8.0,
      category: 'EQUITY',
    };
    const updated = [...assets, newAsset];
    setAssets(updated);

    // Instantly launch edit mode for the new asset
    setEditingId(newAsset.id);
    setEditName(newAsset.name);
    setEditValue('0');
    setEditCagr('8.0');
    setHasChanges(true);
  }, [assets]);

  const handleDeleteAsset = useCallback((assetId: string) => {
    Alert.alert(
      'Delete Asset',
      'Are you sure you want to remove this asset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAssets((prev) => prev.filter((a) => a.id !== assetId));
            setHasChanges(true);
          },
        },
      ]
    );
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Snapshot</Text>
        <Text style={styles.screenSubtitle}>Monthly Offline Ledger</Text>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          🔒 No databases. Strictly private. Update your asset totals below.
        </Text>

        {/* Asset Grid Header */}
        <View style={styles.gridHeader}>
          <Text style={[styles.gridHeaderCell, { flex: 2 }]}>ASSET BUCKET</Text>
          <Text style={[styles.gridHeaderCell, { flex: 1.5 }]}>VALUE (₹)</Text>
          <Text style={[styles.gridHeaderCell, { flex: 0.8 }]}>CAGR (%)</Text>
        </View>

        {/* Asset Rows */}
        {assets.map((asset) => {
          const config = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.EQUITY;
          const isEditing = editingId === asset.id;

          return (
            <GlassPanel
              key={asset.id}
              style={[styles.assetRow, isEditing && styles.assetRowEditing]}
              glowColor={isEditing ? config.color : undefined}
              variant="subtle"
            >
              {/* Row pressable is disabled during active editing to prevent bubbles from closing editor */}
              <TouchableOpacity
                style={styles.assetRowInner}
                onPress={() => startEditing(asset)}
                onLongPress={() => handleDeleteAsset(asset.id)}
                activeOpacity={0.7}
                disabled={isEditing}
              >
                {/* Name */}
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={{ fontSize: 16 }}>{config.emoji}</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.editInput, { flex: 1, color: config.color }]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholderTextColor={ThemeColors.textMuted}
                    />
                  ) : (
                    <Text style={[styles.assetName, { color: config.color }]} numberOfLines={1}>
                      {asset.name}
                    </Text>
                  )}
                </View>

                {/* Value */}
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  {isEditing ? (
                    <TextInput
                      style={[styles.editInput, styles.valueInput]}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="numeric"
                      placeholderTextColor={ThemeColors.textMuted}
                    />
                  ) : (
                    <Text style={styles.assetValue}>
                      {formatINR(asset.value)}
                    </Text>
                  )}
                </View>

                {/* CAGR */}
                <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                  {isEditing ? (
                    <TextInput
                      style={[styles.editInput, styles.cagrInput]}
                      value={editCagr}
                      onChangeText={setEditCagr}
                      keyboardType="numeric"
                      placeholderTextColor={ThemeColors.textMuted}
                    />
                  ) : (
                    <Text style={styles.assetCagr}>
                      {asset.customExpectedCagr}%
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Inline Save/Cancel Action Buttons */}
              {isEditing && (
                <View style={styles.inlineEditControls}>
                  <TouchableOpacity onPress={saveActiveRow} style={styles.inlineActionBtn} activeOpacity={0.7}>
                    <Text style={styles.saveActionText}>✔️ Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelActiveRow} style={styles.inlineActionBtn} activeOpacity={0.7}>
                    <Text style={styles.cancelActionText}>❌ Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassPanel>
          );
        })}

        {/* Add Asset Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddAsset} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+ Add Asset Bucket</Text>
        </TouchableOpacity>

        {/* Total Net Worth */}
        <GlassPanel glowColor={ThemeColors.neonGreen} style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL NET WORTH</Text>
            <Text style={styles.totalValue}>{formatINR(netWorth)}</Text>
          </View>
          <Text style={styles.totalCagr}>
            Weighted CAGR: {weightedCagr}%
          </Text>
        </GlassPanel>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>
            💾  Save Today's Snapshot
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.backgroundStart,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  screenTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.heavy,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: 2,
  },
  screenSubtitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  privacyNote: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },

  // Grid header
  gridHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  gridHeaderCell: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    fontWeight: Typography.weight.medium,
  },

  // Asset row
  assetRow: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  assetRowEditing: {
    borderColor: ThemeColors.borderActive,
  },
  assetRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetName: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
    flex: 1,
  },
  assetValue: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.semibold,
    textAlign: 'right',
  },
  assetCagr: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    textAlign: 'right',
  },

  // Editing inputs
  editInput: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.body,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderMedium,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  valueInput: {
    textAlign: 'right',
    minWidth: 80,
  },
  cagrInput: {
    textAlign: 'right',
    minWidth: 50,
  },

  // Add button
  addButton: {
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
  },

  // Total card
  totalCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  totalValue: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.heavy,
  },
  totalCagr: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
  },

  // Save button
  saveButton: {
    backgroundColor: ThemeColors.frostedPanel,
    borderWidth: 1,
    borderColor: ThemeColors.neonGreen,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    borderColor: ThemeColors.borderLight,
    opacity: 0.5,
  },
  saveButtonText: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
  },
  inlineEditControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  inlineActionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  saveActionText: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.bold,
  },
  cancelActionText: {
    color: ThemeColors.liabilityRed,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.bold,
  },
});
