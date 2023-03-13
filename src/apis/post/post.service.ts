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
import { Post } from './entities/post.entity';
import { PostLikeService } from './post-like.service';
import { PostHashtagService } from './post-hashtag.service';
import { MyListService } from '../collection/my-list.service';
import { Comment } from '../comment/entities/comment.entity';
// import { PostUserTag } from './entities/post-usertag.entity';
// import { PostUserTagService } from './post-user-tag.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    private readonly likeService: PostLikeService,
    private readonly postHashtagService: PostHashtagService,
    private readonly myListService: MyListService, // private readonly postUserTagService: PostUserTagService,
  ) {}

  /*
                                                                              ### 23.03.13
                                                                              ### 이드보라
                                                                              ### 조건 없이 모든 포스팅 불러오기(뉴스피드 페이지).불러오는 유저 정보 수정
                                                                              */
  async getPosts(userId: number) {
    try {
      const posts = await this.postRepository.find({
        where: { deleted_at: null, visibility: 'public' },
        select: ['id', 'content', 'rating', 'img_url', 'updated_at'],
        relations: ['user', 'restaurant', 'hashtags', 'comments'],
      });
      if (!posts || posts.length === 0) {
        throw new NotFoundException('포스트가 없습니다.');
      }
      const postIds = posts.map((post) => post.id);

      const postLikes = await this.likeService.getLikesForAllPosts(postIds);

      const likedStatuses = await this.likeService.getLikedStatusforAllPosts(
        postIds,
        userId,
      );

      return posts.map((post) => {
        const { id, nickname, profile_image } = post.user;
        const hashtags = post.hashtags.map((hashtag) => hashtag.name);
        const likes =
          postLikes.find((like) => like.postId === post.id)?.totalLikes || 0;
        const isLiked =
          likedStatuses.find((status) => status.postId === post.id)?.isLiked ||
          'False';
        const totalComments = post.comments ? post.comments.length : 0;
        return {
          ...post,
          user: { id, nickname, profile_image },
          hashtags,
          totalLikes: likes,
          isLiked,
          totalComments,
        };
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND);
      } else {
        console.error(err);
        throw new InternalServerErrorException(
          'Something went wrong while processing your request. Please try again later.',
        );
      }
    }
  }

  /*
                                                                                ### 23.03.13
                                                                                ### 이드보라
                                                                                ### 포스팅 상세보기.좋아요 기능 추가. 불러오는 유저 정보 수정
                                                                                */
  async getPostById(postId: number, userId: number) {
    try {
      const post = await this.postRepository.find({
        where: { id: postId, deleted_at: null, visibility: 'public' },
        select: ['content', 'rating', 'img_url', 'updated_at'],
        relations: ['restaurant', 'user', 'hashtags'],
      });

      if (!post) {
        throw new NotFoundException(`존재하지 않는 포스트입니다.`);
      }

      const totalLikes = await this.likeService.getLikesForPost(postId);

      const hashtags = post[0].hashtags.map(({ name }) => ({ name }));

      const { isLiked } = await this.likeService.getLikedStatusforOnePost(
        postId,
        userId,
      );

      const totalComments = await this.commentRepository.count({
        where: { deleted_at: null, post: { id: postId } },
      });

      const { id, nickname, profile_image } = post[0].user;

      return {
        ...post[0],
        user: { id, nickname, profile_image },
        totalLikes,
        hashtags,
        isLiked,
        totalComments,
      };
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

  /*
                                                                                ### 23.03.11
                                                                                ### 이드보라
                                                                                ### 포스팅 작성
                                                                                */
  async createPost(
    userId: number,
    restaurantId: number,
    myListIds: number[],
    content: string,
    rating: number,
    img: string,
    visibility,
    hashtagNames: string[],
    // usernames: string[],
  ) {
    try {
      const post = await this.postRepository.create({
        user: { id: userId },
        restaurant: { id: restaurantId },
        content,
        rating,
        img_url: img,
        visibility,
      });

      const hashtags = await this.postHashtagService.createOrUpdateHashtags(
        hashtagNames,
      );

      post.hashtags = hashtags;

      await this.postRepository.save(post);

      const postId = post.id;

      await this.myListService.myListPlusPosting(postId, myListIds);

      return { postId: postId };

      // if (usernames && usernames.length > 0) {
      //   await this.postUserTagService.tagUsersInPost(savedPost.id, usernames);
      // }
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        'Something went wrong while processing your request. Please try again later.',
      );
    }
  }

  /*
                                                                                ### 23.03.10
                                                                                ### 이드보라
                                                                                ### 포스팅 수정
                                                                                */
  async updatePost(
    id: number,
    restaurantId: number,
    myListId: number[],
    content: string,
    rating: number,
    img: string,
    visibility,
    hashtagNames: string[],
  ) {
    try {
      const post = await this.postRepository.findOne({ where: { id } });
      if (!post) {
        throw new NotFoundException(`존재하지 않는 포스트입니다.`);
      }

      await this.postRepository.update(id, {
        restaurant: { id: restaurantId },
        content,
        rating,
        img_url: img,
        visibility,
      });

      const hashtags = await this.postHashtagService.createOrUpdateHashtags(
        hashtagNames,
      );

      post.hashtags = [...hashtags];
      await this.postRepository.save(post);

      const postId = post.id;

      await this.myListService.myListPlusPosting(postId, myListId);

      return { postId: postId };
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

  /*
                                                                                ### 23.03.06
                                                                                ### 이드보라
                                                                                ### 포스팅 삭제
                                                                                */
  async deletePost(id: number) {
    try {
      const result = await this.postRepository.softDelete(id);
      if (result.affected === 0) {
        throw new NotFoundException('존재하지 않는 포스트입니다.');
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
