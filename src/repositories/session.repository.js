export class SessionRepository {
  constructor(db) {
    this.db = db;
  }

  async create(session) {
    const result = await this.db.query(
      "INSERT INTO sessions(email) VALUES($1) RETURNING *",
      [session.email]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await this.db.query(
      "SELECT * FROM sessions WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }
}