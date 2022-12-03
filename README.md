# Connect Four for socket.io - CS465P Fall 2022 Final Project

## How to Run

First, run

    npm install

in the project directory with node package manager to install all the necessary dependencies.

Then run

    npm run

to start the server. By default, the server will listen on port 5000, but this can be changed by typing

    process.env.PORT = <Port Number Here>;

in config/env.js. 

## About this Project

In case you've never heard of it before, Connect Four is a classic two-player game where two players take turns dropping
colored disks into a vertical 6x7 grid. Whoever can link four of their colored disk in a line horizontally, vertically, or diagonally first wins.

To play, connect to the server's domain (or localhost:PORT if you're playing on a local machine). You'll have the option of selecting a room from the list on the right if there are any available, or creating one of your own. As soon as two players join a room, the game starts and the player with the red-colored disk goes first. Whenever it's your turn, select the column you'd wish to drop your piece into. The game will continue until all of the spaces have been filled up (resulting in a draw), until someone wins, or until someone leaves the room. Refreshing or closing the page will disconnect you from the room you were in, and you'll have the option to join a new one from the home page.

## Libraries/Frameworks used

The app was created in Node.js.

socket.io was used for client-server communication in gameplay.

express was used to set up the HTTP server.

The list of dependencies in the package.json are below:

    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "socket.io": "^4.5.4"

## Other materials

The socket.io, express, and Mozilla Web documentation sites were used extensively in the creation of this project.

https://developer.mozilla.org/en-US/docs/Web

https://socket.io/docs/v4/

https://expressjs.com/en/4x/api.html

The Wikipedia page for Connect Four was used referenced to verify board size and draw conditions.

https://en.wikipedia.org/wiki/Connect_Four


