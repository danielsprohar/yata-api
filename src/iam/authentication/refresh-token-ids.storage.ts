import { Injectable } from '@nestjs/common/decorators';
import { RedisService } from '../../redis/redis.service';
import { InvalidatedRefreshTokenError } from './errors';

@Injectable()
export class RefreshTokenIdsStorage {
  constructor(private redisService: RedisService) {}

  /**
   * Insert the <key, value> pair into the db.
   * @param userId user id
   * @param tokenId refresh token id
   */
  async insert(userId: string, tokenId: string): Promise<void> {
    await this.redisService.set(this.getKey(userId), tokenId);
  }

  async validate(userId: string, tokenId: string): Promise<boolean> {
    const storedTokenId = await this.redisService.get(this.getKey(userId));
    return storedTokenId === tokenId;
  }

  /**
   * Remove the ID entry from the db.
   * @param userId
   */
  async invalidate(userId: string): Promise<void> {
    await this.redisService.del(this.getKey(userId));
  }

  private getKey(userId: string): string {
    return `user-${userId}`;
  }
}
