const dateInput = document.getElementById("dateInput");
      const timeSelect = document.getElementById("timeSelect");
      const submitBookButton = document.getElementById("submitBook");
      const emailInput = document.getElementById("email");
      const emailError = document.getElementById("emailError");
      const bookedTimes = new Set();
      const bookingMessage = document.getElementById("bookingMessage");

      dateInput.addEventListener("change", function () {
        const selectedDate = new Date(this.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight for comparison

        if (selectedDate < today) {
          timeSelect.innerHTML =
            '<option value="">Please select a future date.</option>';
          submitBookButton.disabled = true;
          return;
        }

        if (isWeekend(selectedDate)) {
          timeSelect.innerHTML =
            '<option value="">Please select a weekday.</option>';
          submitBookButton.disabled = true;
          return;
        }

        const availableTimes = getAvailableTimes(selectedDate);
        displayAvailableTimes(availableTimes);
        submitBookButton.disabled = false; // Enable booking button
      });

      function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
      }

      function getAvailableTimes(date) {
        const times = [];
        const timeSlots = [
          { start: "08:00", end: "12:00" },
          { start: "13:00", end: "16:00" },
        ];

        timeSlots.forEach((slot) => {
          const start = new Date(date);
          const [startHour, startMinute] = slot.start.split(":").map(Number);
          start.setHours(startHour, startMinute, 0, 0);

          const end = new Date(date);
          const [endHour, endMinute] = slot.end.split(":").map(Number);
          end.setHours(endHour, endMinute, 0, 0);

          while (start < end) {
            const timeString = start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            if (!bookedTimes.has(timeString)) {
              times.push(timeString);
            }
            start.setMinutes(start.getMinutes() + 30);
          }
        });

        return times;
      }

      function displayAvailableTimes(times) {
        timeSelect.innerHTML = '<option value="">Select a time</option>'; // Reset options
        times.forEach((time) => {
          const option = document.createElement("option");
          option.value = time;
          option.textContent = time;
          timeSelect.appendChild(option);
        });
        timeSelect.disabled = times.length === 0; // Disable if no available times
      }

      submitBookButton.addEventListener("click", function () {
        const selectedTime = timeSelect.value;
        const email = emailInput.value;
        const fname = document.getElementById("fname").value;
        const lname = document.getElementById("lname").value;
        const date = dateInput.value;

        // Check if all fields are filled
        if (!fname || !lname || !email || !selectedTime) {
          alert("Please fill in all fields before booking.");
          return;
        }

        // Email validation regex
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          emailError.textContent = "Please enter a valid email address.";
          return;
        } else {
          emailError.textContent = ""; // Clear any previous error messages
        }

        // Prepare data to be sent to the server
        const bookingData = {
          fname,
          lname,
          email,
          date,
          time: selectedTime,
          status,
        };

        // Send booking data to the server
        fetch("http://localhost:3000/book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.text();
          })
          .then((data) => {
            bookingMessage.textContent = data;
            bookingMessage.classList.add("success");
            bookingMessage.classList.remove("error");
            // Clear the select and disable booking button
            timeSelect.value = "";
            submitBookButton.disabled = true;
          })
          .catch((error) => {
            console.error("Error:", error);
            bookingMessage.textContent = "Failed to book. Please try again.";
            bookingMessage.classList.add("error");
          });
      });

      // Cancel appointment functionality
      const submitCancelButton = document.getElementById("submitCancel");
      submitCancelButton.addEventListener("click", function () {
        const selectedTime = timeSelect.value;
        const email = emailInput.value;
        const date = dateInput.value;

        // Check if all fields are filled
        if (!email || !selectedTime || !date) {
          alert("Please provide your email, date, and time to cancel.");
          return;
        }

        // Prepare data to be sent to the server for cancellation
        const cancelData = {
          email,
          time: selectedTime,
          date,
        };

        // Send cancellation request to the server
        fetch("http://localhost:3000/cancel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cancelData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.text();
          })
          .then((data) => {
            bookingMessage.textContent = data;
            bookingMessage.classList.add("success");
            bookingMessage.classList.remove("error");
            // Clear the select and disable booking button
            timeSelect.value = "";
            submitBookButton.disabled = true;
          })
          .catch((error) => {
            console.error("Error:", error);
            bookingMessage.textContent = "Failed to cancel. Please try again.";
            bookingMessage.classList.add("error");
          });
      });
    