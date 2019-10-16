SELECT city ,count(reservations.*) as total_reservations
FROM properties
JOIN reservations ON guest_id = owner_id
GROUP BY properties.city
ORDER BY total_reservations desc;