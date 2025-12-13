# Eruplan Web Client

<p align="center"><img src='https://i.postimg.cc/G3YX9jYR/logo-eruplan.png' alt="Eruplan Logo" height="400"></p>


## 👋 Authors

- **Angelo Antonio Prisco** - [AngeloAntonioPrisco](https://github.com/AngeloAntonioPrisco) as PM.
- **Cristian Ranieri** - [CristianRanieri](https://github.com/CristianRanieri) as PM.
- **Salvatore Grimaldi** - [SalvatoreGrimaldi](https://github.com/salvatoregrimaldi03) as Developer.
- **Ciro Esposito** - [CiroEsposito](https://github.com/ciroesposito04) as Developer.
- **Lorenzo Di Riso** - [LorenzoDiRiso](https://github.com/ldiriso4) as Developer.

We are all students at **University of Salerno (UNISA)**. PMs are currently enrolled in the Master's program in **Software Engineering**, while all developers are enrolled in the Bachelor’s degree program in Computer Science. 

## 📌 What is it?
**Eruplan Web Client** is the official web frontend for the Eruplan system. It provides a browser-based user interface that consumes the Eruplan server API and offers the core client-side features for civil protection operators. This repo contains the static frontend assets (HTML, CSS, JS) and the client-side logic.
Currently, the client implements (or aims to implement) the following features:
- User authentication / login pages for civil protection operators  
- Operator dashboard and status views  
- REST/HTTP integration with the Eruplan backend (API calls)  
- Display and management of client-side resources (lists, forms, cards)  
- Static assets and styling (HTML + CSS) and frontend logic in JavaScript

Main features include:
- Responsive UI for civil protection operator tasks  
- API-driven views that show server data and allow operator actions  
- Modular static structure (separate `html/`, `css/`, `script/` folders)

## 🚀 How to try it
The web client can be executed in a web browser.
### Run the web site
1. Clone the repository:
   ```bash
   git clone https://github.com/T-R-M-V-spin-off/eruplanwebclient.git
   ```
2. Navigate to the html/ folder in the project directory
3. Open login.html directly in your browser.

### Run on a local server
1. Clone the repository:
   ```bash
   git clone https://github.com/T-R-M-V-spin-off/eruplanwebclient.git
   ```
2. Open the project in any IDE (e.g., IntelliJ)
3. Use a simple HTTP server to serve the files locally:
   ```bash
   python -m http.server 8000
   ```
4. Open a browser and navigate to http://localhost:8000/login.html.

## 🧱 Built With
- [HTML](https://html.spec.whatwg.org/) - Markup language used for 
- [CSS](https://www.w3.org/TR/css/) - Programming language used for project styles and layouts.
- [JavaScript](https://www.javascript.com/) - Programming language used for the client (client-side logic, API fetching, and DOM manipulation).

## 🔗 Related resources
- [Eruplan Server](https://github.com/T-R-M-V-spin-off/eruplanserver) - The official Java server for interact with the Web client and Mobile client.
- [Eruplan Mobile Client](https://github.com/T-R-M-V-spin-off/eruplanmobileclient) - The official Java application for interact with the server. 
