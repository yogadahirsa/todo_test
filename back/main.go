package main

import (
	"log"
	"time"
  "fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"

  "gorm.io/gorm"
  "gorm.io/driver/postgres"
)

// config for login
var (
  myUsername = "admin"
  myPassword = "password123"
)

// config database
var (
  dbUser = "postgres"
  dbPassword = "1234"
  dbName = "todo"
)

var (
	jwtSecret = []byte("secret-code")
	users = map[string]string{}
)

func init() {
	hash, _ := bcrypt.GenerateFromPassword([]byte(myPassword), bcrypt.DefaultCost)
	users[myUsername] = string(hash)
}

// jwt Middleware
func jwtMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing or malformed jwt"})
	}

	// expected format: "Bearer <token>"
	var tokenString string
	_, err := fmt.Sscanf(authHeader, "Bearer %s", &tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token format"})
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid or expired token"})
	}

	// store claims in locals for later use
	c.Locals("user", token.Claims)
	return c.Next()
}

func loginHandler(c *fiber.Ctx) error {
	var body LoginRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	storedHash, ok := users[body.Username]
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(body.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}

	claims := jwt.MapClaims{
		"sub":  body.Username,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"role": "user",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString(jwtSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create token"})
	}

	return c.JSON(fiber.Map{
		"access_token": ss,
		"token_type":   "bearer",
		"expires_in":   24 * 3600,
		"user": fiber.Map{
			"username": body.Username,
		},
	})
}

// Model
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type User struct {
	Uuid     uint   `json:"uuid" gorm:"primaryKey"`
	Name     string `json:"name"`
	Username string `json:"username" gorm:"unique"`
	Password string `json:"password"`
}

type Position struct {
	Uuid     uint   `json:"uuid" gorm:"primaryKey"`
	Name     string `json:"name"`
}

type Task struct {
	Uuid          uint   `json:"uuid" gorm:"primaryKey"`
	UserID        int    `json:"user_id"`
	Todo          string `json:"todo"`
	StartDate    *time.Time `json:"start_date"`
	EndDate      *time.Time `json:"end_date"`
}

func main() {
  dsn := fmt.Sprintf(
    "host=localhost user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=Asia/Jakarta",
    dbUser, dbPassword, dbName,
  )
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL: ", err)
	}

	// Auto-migrate schema
	if err := db.AutoMigrate(&User{}); err != nil {
		log.Fatal("Failed migration: ", err)
	}

	app := fiber.New()

	// allow React request
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Post("/login", loginHandler)

  // user route
  app.Get("/users", jwtMiddleware, func(c *fiber.Ctx) error {
		var users []User
		if err := db.Find(&users).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.JSON(users)
	})
  app.Get("/user/:id", jwtMiddleware, func(c *fiber.Ctx) error {
    id := c.Params("id") // get id from URL

    var user User
    if err := db.First(&user, id).Error; err != nil {
      if err == gorm.ErrRecordNotFound {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
          "error": "user not found",
        })
      }
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.JSON(user)
  })
  app.Post("/user/edit", jwtMiddleware, func(c *fiber.Ctx) error {
    var body User
    if err := c.BodyParser(&body); err != nil {
      return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "error": "invalid request body",
      })
    }

    // Find existing user by Uuid
    var user User
    if err := db.First(&user, body.Uuid).Error; err != nil {
      if err == gorm.ErrRecordNotFound {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
          "error": "user not found",
        })
      }
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    // Update fields
    user.Name = body.Name
    user.Username = body.Username

    // Only update password if provided
    if body.Password != "" {
      hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
      user.Password = string(hash)
    }

    if err := db.Save(&user).Error; err != nil {
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.JSON(user)
  })
  app.Post("/user/add", jwtMiddleware, func(c *fiber.Ctx) error {
    var body User
    if err := c.BodyParser(&body); err != nil {
      return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "error": "invalid request body",
      })
    }

    // Hash the password only if it's provided
    if body.Password != "" {
      hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
      if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
          "error": "failed to hash password",
        })
      }
      body.Password = string(hash)
    }

    // Create the user
    if err := db.Create(&body).Error; err != nil {
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.Status(fiber.StatusCreated).JSON(body)
  })
  app.Get("/user/delete/:id", func(c *fiber.Ctx) error {
      uuid := c.Params("id")

      result := db.Delete(&User{}, uuid)
      if result.Error != nil {
          return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
              "error": result.Error.Error(),
          })
      }
      if result.RowsAffected == 0 {
          return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
              "error": "User not found",
          })
      }

      return c.JSON(fiber.Map{
          "message": "User deleted successfully",
      })
  })

  app.Get("/positions", jwtMiddleware, func(c *fiber.Ctx) error {
		var positions []Position
		if err := db.Find(&positions).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.JSON(positions)
	})
  app.Get("/position/:id", jwtMiddleware, func(c *fiber.Ctx) error {
    id := c.Params("id") // get id from URL

    var position Position
    if err := db.First(&position, id).Error; err != nil {
      if err == gorm.ErrRecordNotFound {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
          "error": "user not found",
        })
      }
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.JSON(position)
  })
  app.Post("/position/add", jwtMiddleware, func(c *fiber.Ctx) error {
    var body Position
    if err := c.BodyParser(&body); err != nil {
      return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "error": "invalid request body",
      })
    }

    // Create the position
    if err := db.Create(&body).Error; err != nil {
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.Status(fiber.StatusCreated).JSON(body)
  })
  app.Get("/position/delete/:id", func(c *fiber.Ctx) error {
      uuid := c.Params("id")

      result := db.Delete(&Position{}, uuid)
      if result.Error != nil {
          return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
              "error": result.Error.Error(),
          })
      }
      if result.RowsAffected == 0 {
          return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
              "error": "Position not found",
          })
      }

      return c.JSON(fiber.Map{
          "message": "Position deleted successfully",
      })
  })
  app.Post("/position/edit", jwtMiddleware, func(c *fiber.Ctx) error {
    var body Position
    if err := c.BodyParser(&body); err != nil {
      return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "error": "invalid request body",
      })
    }

    // Find existing user by Uuid
    var position Position
    if err := db.First(&position, body.Uuid).Error; err != nil {
      if err == gorm.ErrRecordNotFound {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
          "error": "user not found",
        })
      }
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    // Update fields
    position.Name = body.Name

    if err := db.Save(&position).Error; err != nil {
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.JSON(position)
  })

  app.Get("/tasks", jwtMiddleware, func(c *fiber.Ctx) error {
		var tasks []Task
		if err := db.Find(&tasks).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.JSON(tasks)
	})
  app.Get("/task/:id", jwtMiddleware, func(c *fiber.Ctx) error {
    id := c.Params("id") // get id from URL

    var task Task
    if err := db.First(&task, id).Error; err != nil {
      if err == gorm.ErrRecordNotFound {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
          "error": "user not found",
        })
      }
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    var users []User
		if err := db.Find(&users).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

    return c.JSON(fiber.Map{
      "task":  task,
      "users": users,
    })
  })
  app.Post("/task/edit", jwtMiddleware, func(c *fiber.Ctx) error {
    var body Task
    if err := c.BodyParser(&body); err != nil {
      return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "error": "invalid request body",
      })
    }

    // Find existing user by Uuid
    var task Task
    if err := db.First(&task, body.Uuid).Error; err != nil {
      if err == gorm.ErrRecordNotFound {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
          "error": "task not found",
        })
      }
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    // Update fields
    task.Todo = body.Todo
    task.UserID = body.UserID
    task.StartDate = body.StartDate
    task.EndDate = body.EndDate

    if err := db.Save(&task).Error; err != nil {
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.JSON(task)
  })
  app.Post("/task/add", jwtMiddleware, func(c *fiber.Ctx) error {
    var body Task
    if err := c.BodyParser(&body); err != nil {
      return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "error": "invalid request body",
      })
    }

    // Create the task
    if err := db.Create(&body).Error; err != nil {
      return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "error": err.Error(),
      })
    }

    return c.Status(fiber.StatusCreated).JSON(body)
  })
  app.Get("/task/delete/:id", func(c *fiber.Ctx) error {
      uuid := c.Params("id")

      result := db.Delete(&Task{}, uuid)
      if result.Error != nil {
          return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
              "error": result.Error.Error(),
          })
      }
      if result.RowsAffected == 0 {
          return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
              "error": "User not found",
          })
      }

      return c.JSON(fiber.Map{
          "message": "Task deleted successfully",
      })
  })

	log.Println("Listening on http://localhost:3000")
	log.Fatal(app.Listen(":3000"))
}
