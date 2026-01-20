package main

import (
	"sort"
	"strings"
	"sync"

	"github.com/emirpasic/gods/trees/redblacktree"
)

type Leaderboard struct {
	users       map[int]*User
	usersByName map[string][]int
	sortedTree  *redblacktree.Tree
	mu          sync.RWMutex
}

func NewLeaderboard() *Leaderboard {
	return &Leaderboard{
		users:       make(map[int]*User),
		usersByName: make(map[string][]int),

		sortedTree: redblacktree.NewWith(func(a, b interface{}) int {
			userA := a.(*User)
			userB := b.(*User)
			

			if userA.Rating != userB.Rating {
				return userB.Rating - userA.Rating
			}
			return userA.ID - userB.ID
		}),
	}
}

func (lb *Leaderboard) AddUser(user *User) {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	lb.users[user.ID] = user

	lowerName := strings.ToLower(user.Username)
	found := false
	for _, id := range lb.usersByName[lowerName] {
		if id == user.ID {
			found = true
			break
		}
	}
	if !found {
		lb.usersByName[lowerName] = append(lb.usersByName[lowerName], user.ID)
	}

	lb.sortedTree.Put(user, user.ID)
}


func (lb *Leaderboard) GetLeaderboard(page, pageSize int) LeaderboardResponse {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	totalUsers := lb.sortedTree.Size()
	start := (page - 1) * pageSize

	if start >= totalUsers {
		return LeaderboardResponse{
			Users:      []UserWithRank{},
			TotalUsers: totalUsers,
			Page:       page,
			PageSize:   pageSize,
		}
	}

	it := lb.sortedTree.Iterator()

	for i := 0; i < start && it.Next(); i++ {
	}

	results := make([]UserWithRank, 0, pageSize)
	currentRank := start + 1
	var prevRating int
	var prevRank int

	for i := 0; i < pageSize && it.Next(); i++ {
		user := it.Key().(*User)

		if i > 0 && user.Rating == prevRating {
			results = append(results, UserWithRank{
				GlobalRank: prevRank,
				ID:         user.ID,
				Username:   user.Username,
				Rating:     user.Rating,
			})
		} else {
			results = append(results, UserWithRank{
				GlobalRank: currentRank,
				ID:         user.ID,
				Username:   user.Username,
				Rating:     user.Rating,
			})
			prevRank = currentRank
		}

		prevRating = user.Rating
		currentRank++
	}

	return LeaderboardResponse{
		Users:      results,
		TotalUsers: totalUsers,
		Page:       page,
		PageSize:   pageSize,
	}
}


func (lb *Leaderboard) SearchUsers(query string) SearchResponse {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	lowerQuery := strings.ToLower(query)
	matchedUsers := make([]*User, 0)

	for _, user := range lb.users {
		if strings.Contains(strings.ToLower(user.Username), lowerQuery) {
			matchedUsers = append(matchedUsers, user)
		}
	}

	sort.Slice(matchedUsers, func(i, j int) bool {
		if matchedUsers[i].Rating == matchedUsers[j].Rating {
			return matchedUsers[i].ID < matchedUsers[j].ID
		}
		return matchedUsers[i].Rating > matchedUsers[j].Rating
	})

	rankMap := make(map[int]int)
	it := lb.sortedTree.Iterator()
	currentRank := 1
	var prevRating int
	var prevRank int
	position := 0

	for it.Next() {
		user := it.Key().(*User)
		
		if position > 0 && user.Rating == prevRating {
			rankMap[user.ID] = prevRank
		} else {
			rankMap[user.ID] = currentRank
			prevRank = currentRank
		}
		
		prevRating = user.Rating
		currentRank++
		position++
	}

	results := make([]UserWithRank, len(matchedUsers))
	for i, user := range matchedUsers {
		results[i] = UserWithRank{
			GlobalRank: rankMap[user.ID],
			ID:         user.ID,
			Username:   user.Username,
			Rating:     user.Rating,
		}
	}

	return SearchResponse{
		Users: results,
		Count: len(results),
	}
}

func (lb *Leaderboard) GetAllUsers() []*User {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	users := make([]*User, 0, len(lb.users))
	for _, user := range lb.users {
		users = append(users, user)
	}
	return users
}

func (lb *Leaderboard) UpdateUserRating(userID int, newRating int) {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	user, exists := lb.users[userID]
	if !exists {
		return
	}

	lb.sortedTree.Remove(user)

	if newRating < 100 {
		newRating = 100
	}
	if newRating > 5000 {
		newRating = 5000
	}

	user.Rating = newRating

	lb.sortedTree.Put(user, user.ID)
}
