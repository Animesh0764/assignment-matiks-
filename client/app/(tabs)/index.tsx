import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient, UserWithRank } from '@/api/client';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { COLORS } from '@/constants/config';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = (colorScheme ?? 'light') === 'dark';

  const [users, setUsers] = useState<UserWithRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadLeaderboard = async (pageNum: number, append: boolean = false) => {
    try {
      setError(null);
      const response = await apiClient.getLeaderboard(pageNum, 50);
      
      if (append) {
        // Deduplicate by ID to prevent duplicate keys
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = response.users.filter(u => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
      } else {
        setUsers(response.users);
      }
      
      setTotalUsers(response.totalUsers);
      setHasMore(response.users.length === 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(1);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadLeaderboard(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeaderboard(nextPage, true);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
      <Text style={[styles.title, { color: isDark ? COLORS.textDark : COLORS.text }]}>
        Leaderboard
      </Text>
      <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
        {totalUsers.toLocaleString()} players competing
      </Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.headerRank, { color: COLORS.textSecondary }]}>
          Rank
        </Text>
        <Text style={[styles.headerText, styles.headerUsername, { color: COLORS.textSecondary }]}>
          Username
        </Text>
        <Text style={[styles.headerText, styles.headerRating, { color: COLORS.textSecondary }]}>
          Rating
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
            Loading leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: COLORS.danger }]}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadLeaderboard(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
      <FlatList
        data={users}
        renderItem={({ item }) => <LeaderboardRow user={item} colorScheme={colorScheme ?? 'light'} />}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 36,
    paddingVertical: 8,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRank: {
    width: 60,
  },
  headerUsername: {
    flex: 1,
  },
  headerRating: {
    width: 80,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
