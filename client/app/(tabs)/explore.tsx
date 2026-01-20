import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient, UserWithRank } from '@/api/client';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { COLORS } from '@/constants/config';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Debounce hook
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}


export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = (colorScheme ?? 'light') === 'dark';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserWithRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await apiClient.searchUsers(searchQuery);
      setResults(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(performSearch, 300);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <Text style={[styles.title, { color: isDark ? COLORS.textDark : COLORS.text }]}>
        Search Player
      </Text>
      <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
        Find any player and see their live global rank
      </Text>

      <View style={[
        styles.searchBox,
        { 
          backgroundColor: isDark ? COLORS.cardDark : COLORS.card,
          borderColor: isDark ? COLORS.borderDark : COLORS.border,
        }
      ]}>
        <Text style={[styles.searchIcon, { color: COLORS.textSecondary }]}>🔎</Text>
        <TextInput
          style={[
            styles.searchInput,
            { color: isDark ? COLORS.textDark : COLORS.text }
          ]}
          placeholder="Enter username (e.g., rahul)"
          placeholderTextColor={COLORS.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {hasSearched && !loading && (
        <Text style={[styles.resultCount, { color: COLORS.textSecondary }]}>
          {results.length > 0 
            ? `Found ${results.length} player${results.length !== 1 ? 's' : ''}`
            : 'No players found'
          }
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: COLORS.danger }]}>
            ⚠️ {error}
          </Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
            Start typing to search for players
          </Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
            No players found matching "{query}"
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderTableHeader = () => {
    if (results.length === 0) return null;

    return (
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
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
      <FlatList
        data={results}
        renderItem={({ item }) => <LeaderboardRow user={item} colorScheme={colorScheme ?? 'light'} />}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderTableHeader()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  searchContainer: {
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
