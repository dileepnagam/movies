const express = require("express");

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");

let db = null;
const initializeDBAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//GET movies API
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `SELECT * FROM movie ORDER BY movie_id`;
  const moviesArray = await db.all(getMoviesQuery); //all method is used to get multiple rows
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

//POST movie API
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `INSERT INTO movie
     (director_id,movie_name,lead_actor) 
    VALUES
    ('${directorId}',
      '${movieName}',
      '${leadActor}'
    );`;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

const dbObjToResObj = (dbObj) => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  };
};

//GET movie API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId}`;
  const movie = await db.get(getMovieQuery); //get method is used to get only single row
  response.send(dbObjToResObj(movie));
});

//UPDATE movie API
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `
    UPDATE movie
    SET
    director_id='${directorId}',
    movie_name='${movieName}',
    lead_actor='${leadActor}'
    WHERE
    movie_id=${movieId};`;
  await db.run(updateMovieQuery); //run method is used to create and update any row
  response.send("Movie Details Updated");
});

//DELETE movie API
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DElETE FROM movie WHERE movie_id=${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const dbOBJtoRES = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  };
};

//GET director API
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director ORDER BY director_id`;
  const directorsArray = await db.all(getDirectorsQuery); //all method is used to get multiple rows
  response.send(directorsArray.map((eachDirctor) => dbOBJtoRES(eachDirctor)));
});

function obbj(obj) {
  return {
    movieName: obj.movie_name,
  };
}

//GET director movies API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
  SELECT movie_name 
  FROM movie INNER JOIN director ON director.director_id=movie.director_id 
  WHERE 
  director.director_id='${directorId}'`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(moviesArray.map((each) => obbj(each)));
});

module.exports = app;
