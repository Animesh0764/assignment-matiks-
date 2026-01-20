import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import React from 'react';
import { COLORS } from '@/constants/config';

export default function TabBarBackground() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    />
  );
}

export function useTabBarHeight() {
  return useBottomTabBarHeight();
}

