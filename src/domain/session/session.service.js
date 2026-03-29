export class SessionService {
  constructor(sessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async createSession(data) {
    return this.sessionRepository.create(data);
  }

  async getSession(id) {
    return this.sessionRepository.findById(id);
  }
}