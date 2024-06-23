import pgPromise from "pg-promise";
const pgp = pgPromise();
pgp.pg.types.setTypeParser(1114, function (stringValue) {
  return stringValue;
});
const db = pgp(
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_IP}:${process.env.DB_PORT}/${process.env.DB_NAME}`
);

export default db;
