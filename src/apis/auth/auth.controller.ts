import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthAccessGuard, AuthRefreshGuard } from './guards/auth.guards';
import { OauthUserDto } from '../user/dto/oauth-user.dto';

@Controller('/')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  //TODO: 이미 소셜로그인 완료했는데, 이메일로 또 로그인하려는 경우 에러처리해야한다.
  @Post('/login')
  async loginEmail(
    @Body(ValidationPipe) loginUserDto: LoginUserDto, //
    @Req() req, //
    // @Res() res, // res 를 써주지 않으면 무한로딩한다.
  ) {
    const { email, password } = loginUserDto;
    const user = await this.userService.findOne({ email });

    if (!user)
      throw new UnprocessableEntityException(' 등록된 이메일이 없습니다.');

    const isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth)
      throw new UnprocessableEntityException('비밀번호가 일치하지 않습니다.');

    const accessToken = this.authService.createAccessToken({
      user,
    });
    const refreshToken = this.authService.createRefreshToken({ user });

    return {
      refreshToken,
      accessToken,
    };
  }

  //소셜(구글)로회원가입 API
  @Get('/signup/google')
  @UseGuards(AuthGuard('google'))
  async signupGoogle(
    @CurrentUser() user: OauthUserDto, //
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.signupOauth({ user });
  }

  //소셜(구글)로로그인 API
  @Get('/login/google')
  @UseGuards(AuthGuard('google'))
  async loginGoogle(
    @CurrentUser() user: OauthUserDto, //
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.loginOauth({ user });
  }

  //AccessToken 재발급 API
  // @UseGuards(AuthAccessGuard)
  //userGuards를 통과하면, user가 통과되었다 refresh토큰에 user정보가 담겨!
  //UseGuards 가 전역에서 사용이 가능할까?
  //useGuards가 전역에서 사용이 가능하도록 해야한다.
  //useGuards가 => 이걸 어떻게 전역에서 사용할 수 있을까?

  // @UseGuards(AuthAccessGuard)
  @UseGuards(AuthRefreshGuard)
  @Post('/restoreAccessToken')
  async restoreAccessToken(
    @CurrentUser() currentUser: any, // @Req() req, // @Request() req,//
  ) {
    // console.log('UseGuards통과한후 req::::::: 찍어보자 ', req.user);
    // console.log('currentUser::::::::::::::::::::', currentUser);
    // useGuards 에서 다 로그인한 user가 통과되니깐  데코레이터는 필요가 없다.
    return this.authService.createAccessToken({ user: currentUser });
    // return this.authService.createAccessToken({ user: req.user });
  }
}

// //네이버로그인
// @Get('/login/naver')
// @UseGuards(AuthGuard('naver'))
// async loginNaver(
//   @Req() req: Request & IOAuthUser, //
//   // @Res() res: Response,
// ) {
//   return this.authService.loginOauth({ req });
// }

// //카카오로그인
// @Get('/login/kakao')
// @UseGuards(AuthGuard('kakao'))
// async loginKakao(
//   @Req() req: Request & IOAuthUser, //
//   // @Res() res: Response,
// ) {
//   // 1. 가입확인
//   return this.authService.loginOauth({ req });
// }
