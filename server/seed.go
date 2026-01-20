package main

import (
	"fmt"
	"math/rand"
)

var (
	firstNames = []string{
		"rahul", "priya", "amit", "neha", "vikram", "anjali", "rohan", "kavya",
		"arjun", "sneha", "aditya", "pooja", "karan", "divya", "rajesh", "simran",
		"sanjay", "meera", "varun", "isha", "nikhil", "tanvi", "manish", "riya",
		"akash", "nisha", "deepak", "swati", "gaurav", "preeti", "vishal", "aarti",
		"mohit", "shreya", "ankit", "sonal", "rahul_mathur", "rahul_burman", "rahul_kumar",
	}

	lastNames = []string{
		"", "_sharma", "_patel", "_kumar", "_singh", "_gupta", "_verma", "_iyer",
		"_reddy", "_nair", "_chopra", "_mehta", "_joshi", "_rao", "_das", "_pandey",
		"_mishra", "_deshpande", "_kulkarni", "_bhat", "_menon", "_pillai", 
		"_mathur", "_burman", "_agarwal", "_malhotra", "_kapur", "_bose",
	}

	suffixes = []string{
		"", "123", "007", "99", "2k", "pro", "king", "ace", "star", "legend",
		"master", "gamer", "alpha", "beta", "prime", "ultra", "mega", "super",
		"21", "22", "23", "24", "25", "x", "v2", "v3", "01", "02", "03",
	}
)

func SeedLeaderboard(lb *Leaderboard, count int) {
	fmt.Printf("Generating %d users...\n", count)

	for i := 1; i <= count; i++ {
		firstName := firstNames[rand.Intn(len(firstNames))]
		
		username := firstName
		
		if rand.Float32() < 0.4 {
			lastName := lastNames[rand.Intn(len(lastNames))]
			username = firstName + lastName
		}
		
		if rand.Float32() < 0.3 {
			suffix := suffixes[rand.Intn(len(suffixes))]
			if suffix != "" {
				username = username + suffix
			}
		}

		rating := generateRealisticRating()

		user := &User{
			ID:       i,
			Username: username,
			Rating:   rating,
		}

		lb.AddUser(user)

		if i%1000 == 0 {
			fmt.Printf("Generated %d users...\n", i)
		}
	}

	fmt.Printf("Successfully generated %d users!\n", count)
}

func generateRealisticRating() int {
	mean := 2500.0
	stdDev := 800.0

	u1 := rand.Float64()
	u2 := rand.Float64()
	z := stdDev * ((-2 * (u1)) + (2 * u2))
	rating := int(mean + z)

	if rating < 100 {
		rating = 100
	}
	if rating > 5000 {
		rating = 5000
	}

	return rating
}

func SimulateScoreUpdates(lb *Leaderboard) int {
	users := lb.GetAllUsers()
	if len(users) == 0 {
		return 0
	}

	numUpdates := 10 + rand.Intn(41)
	if numUpdates > len(users) {
		numUpdates = len(users)
	}

	rand.Shuffle(len(users), func(i, j int) {
		users[i], users[j] = users[j], users[i]
	})

	for i := 0; i < numUpdates; i++ {
		user := users[i]
		change := -50 + rand.Intn(101)
		newRating := user.Rating + change
		lb.UpdateUserRating(user.ID, newRating)
	}

	return numUpdates
}
