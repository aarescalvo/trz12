import { db } from '@/lib/db'

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<T>
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected abstract model: {
    findUnique: (args: { where: { id: string } }) => Promise<T | null>
    findMany: (args?: {
      where?: Record<string, unknown>
      include?: Record<string, unknown>
      orderBy?: Record<string, string>
      skip?: number
      take?: number
    }) => Promise<T[]>
    findFirst: (args?: {
      where?: Record<string, unknown>
      orderBy?: Record<string, string>
    }) => Promise<T | null>
    create: (args: { data: Record<string, unknown> }) => Promise<T>
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<T>
    delete: (args: { where: { id: string } }) => Promise<T>
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>
    aggregate: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } })
  }

  async findAll(options?: {
    where?: Record<string, unknown>
    include?: Record<string, unknown>
    orderBy?: Record<string, string>
    skip?: number
    take?: number
  }): Promise<T[]> {
    return this.model.findMany(options)
  }

  async findOne(where: Record<string, unknown>): Promise<T | null> {
    return this.model.findFirst({ where })
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create({ data: data as Record<string, unknown> })
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data: data as Record<string, unknown>
    })
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } })
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.model.count({ where })
  }

  protected getDb() {
    return db
  }
}
