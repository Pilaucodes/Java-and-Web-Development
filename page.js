const appointmentDateInput = document.getElementById("dateInput");
const appointmentTimeSelect = document.getElementById("timeSelect");
const bookAppointmentButton = document.getElementById("submitBook");
const submitCancelButton = document.getElementById("submitCancel");
const emailInput = document.getElementById("email");
const emailErrorMessage = document.getElementById("emailError");
const bookingStatusMessage = document.getElementById("bookingMessage");

appointmentDateInput.addEventListener("change", function () {
    const selectedDate = new Date(this.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      appointmentTimeSelect.innerHTML = '<option value="">Please select a future date.</option>';
      bookAppointmentButton.disabled = true;
        return;
    }

    if (isWeekend(selectedDate)) {
      
      appointmentTimeSelect.innerHTML = '<option value="">Please select a weekday.</option>';
        bookAppointmentButton.disabled = true;
        return;
    }

    const availableTimes = getAvailableTimes(selectedDate);
    displayAvailableTimes(availableTimes);
    bookAppointmentButton.disabled = false;
});

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function getAvailableTimes(date) {
    const times = [];
    const timeSlots = [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "16:00" }];

    timeSlots.forEach((slot) => {
        const start = new Date(date);
        const [startHour, startMinute] = slot.start.split(":").map(Number);
        start.setHours(startHour, startMinute, 0, 0);

        const end = new Date(date);
        const [endHour, endMinute] = slot.end.split(":").map(Number);
        end.setHours(endHour, endMinute, 0, 0);

        while (start < end) {
            const timeString = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            times.push(timeString);
            start.setMinutes(start.getMinutes() + 30);
        }
    });

    return times;
}

function displayAvailableTimes(times) {
  
  appointmentTimeSelect.innerHTML = '<option value="">Select a time</option>';
    times.forEach((time) => {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        
        appointmentTimeSelect.appendChild(option);
    });
    
    appointmentTimeSelect.disabled = times.length === 0;
}

// Booking functionality
bookAppointmentButton.addEventListener("click", function () {
    const selectedTime = appointmentTimeSelect.value;
    const email = emailInput.value;
    const fname = document.getElementById("fname").value;
    const lname = document.getElementById("lname").value;
    const date = appointmentDateInput.value;

    if (!fname || !lname || !email || !selectedTime) {
        alert("Please fill in all fields before booking.");
        return;
    }
   //validating email.. 
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      emailErrorMessage.textContent = "Please enter a valid email address.";
        return;
    } else {
      emailErrorMessage.textContent = "";
    }

    const bookingData = { fname, lname, email, date, time: selectedTime };

    fetch("http://localhost:3000/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
    })
    .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.text();
    })
    .then((data) => {
      bookingStatusMessage.textContent = data;
        appointmentTimeSelect.value = "";
        bookAppointmentButton.disabled = true;
    })
    .catch((error) => {
      bookingStatusMessage.textContent = "Failed to book. Please try again.";
    });
});

// appointment cancelling functionality
submitCancelButton.addEventListener("click", function () {
    const selectedTime = appointmentTimeSelect.value;
    
    const email = emailInput.value;
    const date = appointmentDateInput.value;

    if (!email || !selectedTime || !date) {
        alert("Please provide your email, date, and time to cancel.");
        return;
    }

    const cancelData = { email, time: selectedTime, date };

    fetch("http://localhost:3000/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cancelData),
    })
    .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.text();
    })
    .then((data) => {
      bookingStatusMessage.textContent = data;
        
        appointmentTimeSelect.value = "";
        bookAppointmentButton.disabled = true;
    })
    .catch((error) => {
        bookingStatusMessage.textContent = "Failed to cancel. Please try again.";
    });
});