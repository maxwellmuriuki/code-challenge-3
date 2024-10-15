const baseURL = "http://localhost:3000";

// Fetch movie details and update UI
const fetchMovieDetails = (id) => {
  fetch(`${baseURL}/films/${id}`)
    .then((response) => response.json())
    .then((movie) => {
      const availableTickets = movie.capacity - movie.tickets_sold;
      updateMovieDetails(movie, availableTickets);
    });
};

// Update movie details on the UI
const updateMovieDetails = (movie, availableTickets) => {
  document.getElementById("poster").src = movie.poster;
  document.getElementById("title").innerText = movie.title;
  document.getElementById("runtime").innerText = `${movie.runtime} minutes`;
  document.getElementById("film-info").innerText = movie.description;
  document.getElementById("showtime").innerText = movie.showtime;
  document.getElementById("ticket-num").innerText = `${availableTickets} remaining tickets`;
  document.getElementById("buy-ticket").innerText = availableTickets > 0 ? "Buy Ticket" : "Sold Out";
  document.getElementById("buy-ticket").disabled = availableTickets === 0;
};

// Fetch all films and populate the menu
const fetchAllFilms = () => {
  fetch(`${baseURL}/films`)
    .then((response) => response.json())
    .then((movies) => {
      const filmList = document.getElementById("films");
      filmList.innerHTML = ""; // Clear existing films
      movies.forEach((movie) => {
        const li = document.createElement("li");
        li.className = "film item";
        li.innerText = movie.title;

        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteButton.className = "ui red button delete";
        deleteButton.dataset.id = movie.id;
        deleteButton.onclick = () => deleteFilm(movie.id); // Bind delete function

        li.appendChild(deleteButton); // Append delete button to the li
        li.addEventListener("click", () => fetchMovieDetails(movie.id));

        // Check if sold out
        const availableTickets = movie.capacity - movie.tickets_sold;
        if (availableTickets === 0) {
          li.classList.add("sold-out");
        }

        filmList.appendChild(li);
      });
      // Automatically load the first movie's details
      if (movies.length > 0) fetchMovieDetails(movies[0].id);
    });
};

// Buy a ticket for the currently selected movie
const buyTicket = () => {
  const title = document.getElementById("title").innerText;
  const id = [...document.getElementById("films").children].find((li) => li.innerText === title).dataset.id;

  fetch(`${baseURL}/films/${id}`)
    .then((response) => response.json())
    .then((movie) => {
      const availableTickets = movie.capacity - movie.tickets_sold;

      if (availableTickets > 0) {
        const updatedTicketsSold = movie.tickets_sold + 1;

        // Update tickets_sold on server
        fetch(`${baseURL}/films/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tickets_sold: updatedTicketsSold }),
        })
          .then(() => {
            // Post ticket purchase
            fetch(`${baseURL}/tickets`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                film_id: id,
                number_of_tickets: 1,
              }),
            }).then(() => {
              updateMovieDetails({ ...movie, tickets_sold: updatedTicketsSold }, availableTickets - 1);
              fetchAllFilms(); // Refresh film list to reflect updated ticket counts
            });
          });
      }
    });
};

// Delete a film from the server
const deleteFilm = (id) => {
  fetch(`${baseURL}/films/${id}`, { method: "DELETE" })
    .then(() => {
      fetchAllFilms(); // Refresh the film list after deletion
    });
};

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  fetchAllFilms();

  document.getElementById("buy-ticket").addEventListener("click", buyTicket);
});

