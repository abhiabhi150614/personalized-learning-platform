import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ 
  progress, 
  color = colors.primary,
  height = 8,
  style 
}: ProgressBarProps) {
  return (
    <View style={[styles.container, { height }, style]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${Math.min(Math.max(0, progress), 1) * 100}%`,
            backgroundColor: color
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
}); 