import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserWithRank } from '../api/client';
import { COLORS } from '../constants/config';

interface LeaderboardRowProps {
  user: UserWithRank;
  colorScheme?: 'light' | 'dark';
}

export function LeaderboardRow({ user, colorScheme = 'light' }: LeaderboardRowProps) {
  const isDark = colorScheme === 'dark';

  // Special styling for top 3
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: COLORS.rank1, color: '#000' };
    if (rank === 2) return { backgroundColor: COLORS.rank2, color: '#000' };
    if (rank === 3) return { backgroundColor: COLORS.rank3, color: '#fff' };
    return { backgroundColor: isDark ? COLORS.cardDark : COLORS.card };
  };

  const rankStyle = getRankStyle(user.globalRank);
  const isTopThree = user.globalRank <= 3;

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDark ? COLORS.cardDark : COLORS.card,
        borderColor: isDark ? COLORS.borderDark : COLORS.border,
      }
    ]}>
      <View style={[
        styles.rankBadge,
        { backgroundColor: rankStyle.backgroundColor }
      ]}>
        <Text style={[
          styles.rank,
          { color: rankStyle.color || (isDark ? COLORS.textDark : COLORS.text) },
          isTopThree && styles.rankBold
        ]}>
          {user.globalRank}
        </Text>
      </View>

      <Text style={[
        styles.username,
        { color: isDark ? COLORS.textDark : COLORS.text }
      ]}>
        {user.username}
      </Text>

      <View style={[
        styles.ratingBadge,
        { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }
      ]}>
        <Text style={[
          styles.rating,
          { color: COLORS.primary }
        ]}>
          {user.rating}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 18,
    fontWeight: '600',
  },
  rankBold: {
    fontWeight: '800',
    fontSize: 20,
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  ratingBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
  },
});
