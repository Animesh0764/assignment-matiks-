# Matiks Leaderboard System

A high-performance, real-time leaderboard system built with **Go** (backend) and **React Native/Expo** (mobile client). This system efficiently manages user rankings, supports real-time score updates, and provides fast search capabilities.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Current Implementation](#-current-implementation)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Scaling to 1M+ Users](#-scaling-to-1m-users)
- [Performance Analysis](#-performance-analysis)

---

## ✨ Features

- **Real-time Leaderboard**: Paginated leaderboard with efficient ranking calculation
- **User Search**: Fast username search with partial matching
- **Concurrent Updates**: Thread-safe operations using mutex locks
- **Auto-simulation**: Automatic score updates every 30 seconds for testing
- **CORS Support**: Cross-origin resource sharing enabled for web/mobile clients
- **Rank Ties**: Proper handling of users with identical ratings

---

## 🏗️ Architecture Overview

### Backend (Go)

```
server/
├── main.go           # Server initialization, routing, CORS, auto-updates
├── leaderboard.go    # Core leaderboard logic with Red-Black Tree
├── handlers.go       # HTTP request handlers
├── models.go         # Data structures (User, UserWithRank, etc.)
└── seed.go           # Data generation and simulation utilities
```

### Frontend (React Native/Expo)

```
client/
├── app/              # Expo Router pages
├── components/       # Reusable UI components
├── api/              # API client for backend communication
└── constants/        # Theme and configuration
```

---

## 🔧 Current Implementation

### Data Structures

The system uses **three complementary data structures** for optimal performance:

#### 1. **Red-Black Tree** (Primary Sorting Structure)
```go
sortedTree *redblacktree.Tree
```
- **Purpose**: Maintains users in sorted order by rating (descending) and ID (ascending)
- **Time Complexity**:
  - Insert: `O(log n)`
  - Delete: `O(log n)`
  - Search by rank: `O(log n + k)` where k is the page size
- **Why Red-Black Tree?**
  - Self-balancing ensures consistent performance
  - Efficient range queries for pagination
  - No rebalancing overhead like AVL trees

#### 2. **Hash Map by User ID**
```go
users map[int]*User
```
- **Purpose**: Fast user lookup by ID
- **Time Complexity**: `O(1)` average case
- **Use Case**: Quick access for score updates

#### 3. **Hash Map by Username**
```go
usersByName map[string][]int
```
- **Purpose**: Username search optimization
- **Time Complexity**: `O(1)` for exact match, `O(n)` for partial match
- **Use Case**: Search functionality

### Core Operations

#### Adding a User
```go
func (lb *Leaderboard) AddUser(user *User)
```
- Adds to all three data structures
- **Time Complexity**: `O(log n)`

#### Getting Leaderboard (Paginated)
```go
func (lb *Leaderboard) GetLeaderboard(page, pageSize int) LeaderboardResponse
```
- Iterates through Red-Black Tree
- Handles rank ties correctly
- **Time Complexity**: `O(log n + k)` where k = page size

#### Searching Users
```go
func (lb *Leaderboard) SearchUsers(query string) SearchResponse
```
- Partial string matching on usernames
- Returns results sorted by rating
- **Time Complexity**: `O(n)` worst case (full scan)

#### Updating User Rating
```go
func (lb *Leaderboard) UpdateUserRating(userID int, newRating int)
```
- Removes user from tree, updates rating, re-inserts
- **Time Complexity**: `O(log n)`

### Concurrency Control

All operations use **Read-Write Mutex** (`sync.RWMutex`):
- **Write Lock**: For modifications (AddUser, UpdateUserRating)
- **Read Lock**: For queries (GetLeaderboard, SearchUsers)

This allows multiple concurrent reads while ensuring data consistency during writes.

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/health` | Health check | - |
| `GET` | `/api/leaderboard` | Get paginated leaderboard | `page` (default: 1), `size` (default: 100, max: 500) |
| `GET` | `/api/search` | Search users by username | `username` (required) |
| `POST` | `/api/simulate-update` | Manually trigger score updates | - |

### Example Requests

```bash
# Get first page of leaderboard
curl http://localhost:8080/api/leaderboard?page=1&size=100

# Search for users
curl http://localhost:8080/api/search?username=rahul

# Health check
curl http://localhost:8080/api/health
```

---

## 🚀 Getting Started

### Prerequisites

- **Go** 1.21+ (backend)
- **Node.js** 18+ (frontend)
- **Expo CLI** (for mobile development)

### Backend Setup

```bash
cd server

# Install dependencies
go mod download

# Run the server
go run .

# Server will start on http://localhost:8080
```

The server automatically seeds 10,000 users on startup and simulates score updates every 30 seconds.

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app or press 'w' for web
```

---

## 📈 Scaling to 1M+ Users

The current in-memory implementation works well for **10K-100K users**, but scaling to **1M+ users** requires architectural changes. Here's a comprehensive scaling strategy:

### 1. ✅ **Red-Black Tree Foundation (Already Implemented)**

**Current State**: ✅ Already using Red-Black Tree

**Why it scales**:
- `O(log n)` operations remain efficient even at 1M users
- Memory footprint: ~100 bytes per user = ~100MB for 1M users
- No changes needed for this component

**Performance at scale**:
- 1M users: ~20 tree levels (log₂(1,000,000) ≈ 20)
- Insert/Update: ~20 comparisons
- Pagination: ~20 + page_size operations

---

### 2. 🗄️ **Database Persistence Layer**

**Problem**: In-memory data is lost on server restart and doesn't support horizontal scaling.

**Solution**: Add PostgreSQL/MySQL with proper indexing

#### Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Composite index for leaderboard queries
CREATE INDEX idx_rating_id ON users(rating DESC, id ASC);

-- Index for username search
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_username_lower ON users(LOWER(username));
```

#### Why This Works

- **B-Tree Indexes**: Database indexes use B-trees, providing `O(log n)` lookups
- **Composite Index**: `(rating DESC, id ASC)` allows efficient pagination without sorting
- **Row Number Function**: Calculate ranks efficiently:

```sql
-- Get leaderboard with ranks (no sorting needed!)
SELECT 
    ROW_NUMBER() OVER (ORDER BY rating DESC, id ASC) as global_rank,
    id, username, rating
FROM users
LIMIT 100 OFFSET 0;
```

#### Performance Benefits

- **No in-memory sorting**: Database handles it with indexes
- **Persistent state**: Survives server restarts
- **Horizontal scaling**: Read replicas for query distribution
- **Time Complexity**: Still `O(log n)` for indexed queries

---

### 3. ⚡ **Redis Caching Layer**

**Problem**: Database queries, even with indexes, add latency (5-50ms per query).

**Solution**: Cache frequently accessed data in Redis

#### Caching Strategy

```go
// Cache structure
type CacheLayer struct {
    redis *redis.Client
    db    *sql.DB
    ttl   time.Duration
}

// Cache keys
const (
    LEADERBOARD_PREFIX = "leaderboard:page:"
    USER_RANK_PREFIX   = "user:rank:"
    SEARCH_PREFIX      = "search:"
)
```

#### What to Cache

1. **Leaderboard Pages** (Hot Data)
   ```go
   key := fmt.Sprintf("leaderboard:page:%d:size:%d", page, pageSize)
   ttl := 30 * time.Second
   ```
   - Cache top 10-20 pages (most frequently accessed)
   - TTL: 30 seconds (balance freshness vs. load)

2. **User Ranks** (Moderate Data)
   ```go
   key := fmt.Sprintf("user:rank:%d", userID)
   ttl := 60 * time.Second
   ```
   - Cache individual user ranks
   - Invalidate on score update

3. **Search Results** (Cold Data)
   ```go
   key := fmt.Sprintf("search:%s", query)
   ttl := 5 * time.Minute
   ```
   - Cache popular search queries
   - Longer TTL since less time-sensitive

#### Write Strategy: Periodic Persistence

```go
// In-memory updates + periodic DB writes
func (lb *Leaderboard) UpdateUserRating(userID int, newRating int) {
    // 1. Update in-memory Red-Black Tree (fast)
    lb.updateInMemory(userID, newRating)
    
    // 2. Add to write queue (non-blocking)
    lb.writeQueue <- UpdateEvent{UserID: userID, Rating: newRating}
    
    // 3. Invalidate cache
    lb.cache.Delete(fmt.Sprintf("user:rank:%d", userID))
}

// Background worker: Batch writes every 15-30 minutes
func (lb *Leaderboard) persistWorker() {
    ticker := time.NewTicker(15 * time.Minute)
    for {
        select {
        case <-ticker.C:
            lb.batchWriteToDB()
        }
    }
}
```

#### Benefits

- **Reduced DB Load**: 95%+ cache hit rate for leaderboard queries
- **Fast Reads**: Redis latency ~1ms vs DB ~10-50ms
- **Write Batching**: Reduces DB write operations by 90%+
- **Cost Efficiency**: Fewer database IOPS = lower costs

---

### 4. 🔄 **Horizontal Scaling Architecture**

**Problem**: Single server bottleneck for 1M+ concurrent users.

**Solution**: Multi-tier architecture with load balancing

```
                    ┌─────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ App     │       │ App     │       │ App     │
    │ Server 1│       │ Server 2│       │ Server 3│
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Redis Cluster│
                    │  (Cache)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │  (Primary)   │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ Read    │       │ Read    │       │ Read    │
    │ Replica │       │ Replica │       │ Replica │
    └─────────┘       └─────────┘       └─────────┘
```

#### Component Roles

1. **Load Balancer**
   - Distributes traffic across app servers
   - Health checks and failover
   - SSL termination

2. **App Servers** (Stateless)
   - Each maintains in-memory Red-Black Tree
   - Synchronized via Redis pub/sub for updates
   - Horizontal scaling: Add more servers as needed

3. **Redis Cluster**
   - Shared cache across all app servers
   - Pub/Sub for real-time synchronization
   - Sharding for large datasets

4. **PostgreSQL**
   - Primary: Handles all writes
   - Read Replicas: Distribute read load
   - Streaming replication for consistency


## 📊 Performance Analysis

### Current Implementation (10K Users)

| Operation | Time Complexity | Actual Performance |
|-----------|----------------|-------------------|
| Add User | O(log n) | ~0.01ms |
| Update Rating | O(log n) | ~0.02ms |
| Get Leaderboard | O(log n + k) | ~1-2ms (k=100) |
| Search Users | O(n) | ~5-10ms |

### Scaled Implementation (1M Users)

| Operation | Without Optimization | With Redis Cache | With DB + Cache |
|-----------|---------------------|------------------|-----------------|
| Get Leaderboard | ~50ms | ~1ms (cache hit) | ~10ms (cache miss) |
| Search Users | ~500ms | ~2ms (cache hit) | ~20ms (indexed) |
| Update Rating | ~0.05ms | ~0.05ms + async write | ~0.05ms + batched write |

---

## 👨‍💻 Author

**Animesh Singh**

## 📄 License

This project is part of a technical assignment for Matiks.
