package main

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Handler wraps the leaderboard for HTTP handlers
type Handler struct {
	lb *Leaderboard
}

// NewHandler creates a new handler
func NewHandler(lb *Leaderboard) *Handler {
	return &Handler{lb: lb}
}

// GetLeaderboard handles GET /api/leaderboard
func (h *Handler) GetLeaderboard(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	sizeStr := c.DefaultQuery("size", "100")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(sizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 100
	}

	if pageSize > 500 {
		pageSize = 500
	}

	response := h.lb.GetLeaderboard(page, pageSize)
	c.JSON(http.StatusOK, response)
}

// SearchUsers handles GET /api/search
func (h *Handler) SearchUsers(c *gin.Context) {
	query := c.Query("username")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "username query parameter is required",
		})
		return
	}

	response := h.lb.SearchUsers(query)
	c.JSON(http.StatusOK, response)
}

// SimulateUpdate handles POST /api/simulate-update
func (h *Handler) SimulateUpdate(c *gin.Context) {
	numUpdated := SimulateScoreUpdates(h.lb)
	
	c.JSON(http.StatusOK, gin.H{
		"message":      "Scores updated successfully",
		"usersUpdated": numUpdated,
	})
}

// HealthCheck handles GET /api/health
func (h *Handler) HealthCheck(c *gin.Context) {
	users := h.lb.GetAllUsers()
	c.JSON(http.StatusOK, gin.H{
		"status":     "healthy",
		"totalUsers": len(users),
		"timestamp":  fmt.Sprintf("%v", c.Request.Context().Value("timestamp")),
	})
}
