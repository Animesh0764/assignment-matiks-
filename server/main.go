package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	fmt.Println("Starting Matiks Leaderboard Server...")

	lb := NewLeaderboard()

	SeedLeaderboard(lb, 10000)

	handler := NewHandler(lb)

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	router.Use(func(c *gin.Context) {
		c.Set("timestamp", time.Now())
		c.Next()
	})

	api := router.Group("/api")
	{
		api.GET("/health", handler.HealthCheck)
		api.GET("/leaderboard", handler.GetLeaderboard)
		api.GET("/search", handler.SearchUsers)
		api.POST("/simulate-update", handler.SimulateUpdate)
	}

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			numUpdated := SimulateScoreUpdates(lb)
			fmt.Printf("Auto-updated %d user ratings\n", numUpdated)
		}
	}()

	port := "8080"
	fmt.Printf("Server running on http://localhost:%s\n", port)
	fmt.Println("API Endpoints:")
	fmt.Println("   GET  /api/health")
	fmt.Println("   GET  /api/leaderboard?page=1&size=100")
	fmt.Println("   GET  /api/search?username=rahul")
	fmt.Println("   POST /api/simulate-update")

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
