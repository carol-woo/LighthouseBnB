const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'crol',
  password: '123',
  host: 'localhost',
  database: 'lighthousebnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool.query(`
  SELECT * 
  FROM users
  WHERE email = $1
  `, [email])
    .then(res => res.rows[0])
    .catch(e => console.error(e.stack));
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool.query(`
  SELECT * 
  FROM users
  WHERE users.id = $1
  `, [id])
    .then(res => res.rows[0])
    .catch(e => console.error(e.stack));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool.query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `, [user.name, user.email, user.password])
    .then(res => res.rows[0])
    .catch(e => console.error(e.stack));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool.query(`
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `, [guest_id, limit])
    .then(res => res.rows)
    .catch(e => console.error(e.stack));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */


const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  console.log("DO I RUN!!!!??????")
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (queryParams.length === 1) {
      queryString += `WHERE city LIKE $${queryParams.length} `;
    } else {
      queryString += `
    AND city LIKE $${queryParams.length}`
    }
  }


  if (options.owner_id) {

    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    if (queryParams.length === 1) {
      queryString += `
    WHERE properties.cost_per_night < $${queryParams.length}
    `;
    } else {
      queryString += `
      AND properties.cost_per_night < $${queryParams.length}`;
    }
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`$${options.minimin_price_per_night} `);
    if (queryParams.length === 1) {
      queryString += `
      WHERE properties.cost_per_night > $${queryParams.length}
      `;
    } else {
      queryString += `
        AND properties.cost_per_night > $${queryParams.length}`;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(`$${options.minimum_rating}`)
    if (queryParams.length === 1) {
      queryString += `
      WHERE property_reviews.rating >= $${queryParams.length};
      `;
    } else {
      queryString += `
        AND property_reviews.rating >= $${queryParams.length};`;
    }
  }

  console.log("Q-string! ", queryString, "Q-params! ", queryParams);



  console.log(queryString)
  console.log(queryParams)

  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};`;
  return pool.query(queryString, queryParams)
    .then(res => {
      console.log("WE RAN !!!!!!")
      return res.rows;

    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  console.log(property);
  return pool.query(`
  INSERT INTO properties( 
    title,description,number_of_bedrooms,number_of_bathrooms,
    parking_spaces,cost_per_night,thumbnail_photo_url,cover_photo_url,street,country,city,province,post_code,owner_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *;`, [property.title, property.description, property.number_of_bedrooms, property.number_of_bathrooms, property.parking_spaces, property.cost_per_night, property.thumbnail_photo_url, property.cover_photo_url, property.street, property.country, property.city, property.province, property.post_code, property.owner_id])
    .then(res => res.rows)
    .catch(e => console.error(e.stack));
};
exports.addProperty = addProperty;
