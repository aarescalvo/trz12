import { BaseRepository } from '@/core/repository/base.repository'

export abstract class BaseService<T> {
  protected abstract repository: BaseRepository<T>

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id)
  }

  async findAll(options?: {
    where?: Record<string, unknown>
    include?: Record<string, unknown>
    orderBy?: Record<string, string>
    skip?: number
    take?: number
  }): Promise<T[]> {
    return this.repository.findAll(options)
  }

  async create(data: Partial<T>): Promise<T> {
    return this.repository.create(data)
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<T> {
    return this.repository.delete(id)
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.repository.count(where)
  }
}
