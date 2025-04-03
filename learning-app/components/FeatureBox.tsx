import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface FeatureBoxProps {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
}

export function FeatureBox({ 
  title, 
  description, 
  icon, 
  color, 
  onPress 
}: FeatureBoxProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: color + '40' }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <MaterialIcons 
        name="chevron-right" 
        size={20} 
        color={colors.gray[400]} 
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  title: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
    flex: 1,
  },
  description: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    flex: 2,
  },
  arrow: {
    marginLeft: 8,
  },
}); 