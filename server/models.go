package main

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Rating   int    `json:"rating"`
}

type UserWithRank struct {
	GlobalRank int    `json:"globalRank"`
	ID         int    `json:"id"`
	Username   string `json:"username"`
	Rating     int    `json:"rating"`
}

type LeaderboardResponse struct {
	Users      []UserWithRank `json:"users"`
	TotalUsers int            `json:"totalUsers"`
	Page       int            `json:"page"`
	PageSize   int            `json:"pageSize"`
}
type SearchResponse struct {
	Users []UserWithRank `json:"users"`
	Count int            `json:"count"`
}
