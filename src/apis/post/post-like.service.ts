import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Repository } from 'typeorm';
import { PostLike } from './entities/post-like.entity';
import { Post } from './entities/post.entity';

@Injectable()
export class PostLikeService {
  constructor(
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /*
                                                      ### 23.03.08
                                                      ### 이드보라
                                                      ### 한개의 포스팅의 총 좋아요 수 불러오기
                                                      */

  async getLikesForPost(postId: number): Promise<number> {
    try {
      const likes = await this.postLikeRepository
        .createQueryBuilder('post_like')
        .select('COUNT(post_like.post_id)', 'likes')
        .where('post_like.post_id = :postId', { postId })
        .getRawOne();

      return likes.likes;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        'Something went wrong while processing your request. Please try again later.',
      );
    }
  }

  /*
                                                    ### 23.03.08
                                                    ### 이드보라
                                                    ### 모든 포스팅의 각 좋아요 수 불러오기
                                                    */

  async getLikesForAllPosts(
    postIds: number[],
  ): Promise<{ postId: number; totalLikes: number }[]> {
    try {
      const postLikes = await this.postLikeRepository
        .createQueryBuilder('post_like')
        .select('post_like.post_id', 'postId')
        .addSelect('COUNT(*)', 'totalLikes')
        .where('post_like.post_id IN (:...postIds)', { postIds })
        .groupBy('post_like.post_id')
        .getRawMany();

      return postLikes.map((postLike) => ({
        postId: postLike.postId,
        totalLikes: postLike.totalLikes,
      }));
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        'Something went wrong while processing your request. Please try again later.',
      );
    }
  }

  /*
                                                    ### 23.03.09
                                                    ### 이드보라
                                                    ### 포스트 하나 좋아요 하기
                                                    */

  async likePost(postId, userId) {
    try {
      const existingPost = await this.postRepository.findOne({
        where: { id: postId },
      });

      if (!existingPost) {
        throw new NotFoundException('존재하지 않는 포스트입니다.');
      }

      const existLike = await this.postLikeRepository.findOne({
        where: {
          post: { id: postId },
          user: { id: userId },
        },
        withDeleted: true,
      });

      if (existLike && existLike.deleted_at !== null) {
        await this.postLikeRepository.restore({
          post: { id: postId },
          user: { id: userId },
        });
      } else {
        await this.postLikeRepository.insert({
          post: { id: postId },
          user: { id: userId },
        });
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      } else {
        console.error(err);
        throw new InternalServerErrorException(
          'Something went wrong while processing your request. Please try again later.',
        );
      }
    }
  }

  async unlikePost(postId, userId) {
    try {
      const existingPost = await this.postRepository.findOne({
        where: { id: postId },
      });

      if (!existingPost) {
        throw new NotFoundException('존재하지 않는 포스트입니다.');
      }

      const existLike = await this.postLikeRepository.findOne({
        where: {
          post: { id: postId },
          user: { id: userId },
        },
        withDeleted: true,
      });

      if (existLike && existLike.deleted_at === null) {
        await this.postLikeRepository.softDelete({
          post: { id: postId },
          user: { id: userId },
        });
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      } else {
        console.error(err);
        throw new InternalServerErrorException(
          'Something went wrong while processing your request. Please try again later.',
        );
      }
    }
  }
}
