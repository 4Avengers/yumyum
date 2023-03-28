import { Follow } from './../user/entities/follow.entity';
import { Restaurant } from 'src/apis/restaurant/entities/restaurant.entity';
import { Collection } from './entities/collection.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CollectionItem } from './entities/collection-item.entity';
import { Post } from '../post/entities/post.entity';
import { Comment } from '../comment/entities/comment.entity';
import { PostLikeService } from '../post/post-like.service';
import { ImageRepository } from '../post/image.repository';
import { PostHashtagService } from '../post/post-hashtag.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { UploadService } from '../upload/upload.service';
import { User } from '../user/entities/user.entity';
export declare class MyListService {
    private collectionRepository;
    private collectionItemRepository;
    private postRepository;
    private commentRepository;
    private readonly likeService;
    private followRepository;
    private userRepository;
    private imageRepository;
    private readonly postHashtagService;
    private readonly restaurantService;
    private readonly uploadService;
    constructor(collectionRepository: Repository<Collection>, collectionItemRepository: Repository<CollectionItem>, postRepository: Repository<Post>, commentRepository: Repository<Comment>, likeService: PostLikeService, followRepository: Repository<Follow>, userRepository: Repository<User>, imageRepository: ImageRepository, postHashtagService: PostHashtagService, restaurantService: RestaurantService, uploadService: UploadService);
    getMyListDetail(collectionId: number, page: string, userId: number): Promise<{
        id: number;
        name: string;
        description: string;
        visibility: "public" | "private";
        post: any[];
    }>;
    getMyListsDetailPost(userId: number, restaurantId: number, collectionId: number, page: string): Promise<{
        id: number;
        content: string;
        rating: number;
        updated_at: Date;
        user: User;
        restaurant: Restaurant;
        images: import("../post/entities/image.entity").Image[];
        hashtags: string[];
        totalLikes: number;
        isLiked: any;
        totalComments: number;
        myList: CollectionItem[];
        visibility: "public" | "private";
    }[]>;
    getMyListsName(userId: number): Promise<Collection[]>;
    getMyListsMe(userId: number, page: string): Promise<Collection[]>;
    getMyListsAll(userId: number, page: string): Promise<{
        collectionItems: CollectionItem[];
        id: number;
        type: string;
        name: string;
        description: string;
        image: string;
        user_id: number;
        visibility: "public" | "private";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        user: User;
    }[]>;
    createMyList(userId: number, name: string, type: 'myList'): Promise<import("typeorm").InsertResult>;
    getMyListInfo(collectionId: number): Promise<Collection>;
    updateMyList(userId: number, collectionId: number, name: string, image: string, description: string, visibility: 'public' | 'private', file: any): Promise<{
        name: string;
        image: string;
        description: string;
        visibility: "public" | "private";
    }>;
    deleteMyList(collectionId: number): Promise<import("typeorm").DeleteResult>;
    myListPlusPosting(postId: number, collectionId: number[]): Promise<any[]>;
    myListMinusPosting(postId: number, collectionId: number): Promise<void>;
    myListUpdatePosting(postId: number, collectionId: number[]): Promise<void>;
    HotMyList(): Promise<{
        id: any;
        name: any;
        user: {
            id: any;
            nickname: any;
            profile_image: any;
        };
        sumLikes: any;
        images: any[];
    }[]>;
    FollowersMyList(userId: number): Promise<CollectionItem[]>;
}
