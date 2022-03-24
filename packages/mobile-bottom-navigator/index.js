const items = document.querySelectorAll(".mobile-bottom-navigator li")
items.forEach(item => {
    item.addEventListener("click", () => {
        items.forEach(item => item.classList.remove("active"))
        item.classList.add("active")
    })
})