import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserProfileService } from '../user/user-profile.service';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRefreshGuard } from './guards/auth.guards';

import {
  loginEmail,
  loginGoogle,
  loginKakao,
  loginNaver,
  restoreAccessToken,
} from './auth.decorators';
import { ApiTags } from '@nestjs/swagger';
import { OauthPassportDto } from './dto/oauth-passport.dto';
import {
  SocialLoginProviderDTO,
  SocialLoginBodyDTO,
} from './dto/social-login.dto';

@ApiTags('Auth')
@Controller('/')
export class AuthController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly authService: AuthService,
  ) {}

  // 소셜 로그인 API - Passport 미사용
  // @Post('oauth/login/:provider')
  // @HttpCode(200)
  // async oauthSignIn(
  //   @Param('provider') provider: string,
  //   @Body() body: SocialLoginBodyDTO,
  // ) {
  //   console.log('들어오나 확인', provider, body);

  //   if (provider === 'google') {
  //     return await this.authService.oauthLoginGoogle(provider, body);
  //   } else if (provider === 'kakao') {
  //     return await this.authService.oauthLoginKakao(provider, body);
  //   } else {
  //     throw new BadRequestException(`Invalid provider: ${provider}`);
  //   }
  // }

  // Social Login API - Passport not used
  @Post('oauth/login/:provider')
  @HttpCode(200)
  async oauthSignIn(
    @Param('provider') provider: string,
    @Body() body: SocialLoginBodyDTO,
  ) {
    console.log('Check if its coming in', provider, body);

    if (provider === 'google') {
      return await this.authService.oauthLoginGoogle(provider, body);
    } else if (provider === 'kakao') {
      return await this.authService.oauthLoginSocial(provider, body);
    } else if (provider === 'naver') {
      return await this.authService.oauthLoginSocial(provider, body);
    } else {
      throw new BadRequestException(`Invalid provider: ${provider}`);
    }
  }

  // //구글로그인-Passport미사용
  // @Post('oauth/login/:google')
  // @HttpCode(200)
  // async oauthSignUpGoogle(
  //   @Param() params: SocialLoginProviderDTO,
  //   @Body() body: SocialLoginBodyDTO,
  // ) {
  //   const { provider } = params;
  //   console.log('들어오나 확인', provider, body);
  //   return await this.authService.oauthLoginGoogle(provider, body);
  // }

  // //카카오/네이버로그인-Passport미사용
  // @Post('oauth/login/:kakao')
  // @HttpCode(200)
  // async oauthSignUpKakao(
  //   @Param() params: SocialLoginProviderDTO,
  //   @Body() body: SocialLoginBodyDTO,
  // ) {
  //   const { provider } = params;
  //   console.log('들어오나 확인', provider, body);
  //   return await this.authService.oauthLoginKakao(provider, body);
  // }

  /*


  
  */

  //TODO: 이미 소셜로그인 완료했는데, 이메일로 또 로그인하려는 경우 에러처리해야한다.
  @loginEmail() //스웨거전용커스텀데코레이터
  @Post('/login')
  async loginEmail(
    @Body(ValidationPipe) loginUserDto: LoginUserDto, //
  ) {
    const { email, password } = loginUserDto;
    const user = await this.userProfileService.findByEmail({ email });

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
      user: {
        userId: user.id,
        nickname: user.nickname,
        email: user.email,
        profileImage: user.profile_image,
      },
    };
  }

  //액세스토큰복구
  @UseGuards(AuthRefreshGuard)
  @restoreAccessToken() //스웨거전용커스텀데코레이터
  @Post('/restore-access-token')
  async restoreAccessToken(
    @CurrentUser() currentUser: any, //
  ) {
    const accessToken = this.authService.createAccessToken({
      user: currentUser,
    });
    return { accessToken };
  }

  //구글로그인-Passport 사용
  // @loginGoogle() //스웨거전용커스텀데코레이터
  @Get('/login/passport/google')
  @UseGuards(AuthGuard('google'))
  async loginGoogle(
    @CurrentUser() user: OauthPassportDto, //
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    return this.authService.loginOauthByPassport({ user });
  }

  //카카오로그인-Passport 사용
  @Get('/login/passport/kakao')
  @UseGuards(AuthGuard('kakao'))
  async loginKakao(
    @CurrentUser() user: OauthPassportDto, //
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    return this.authService.loginOauthByPassport({ user });
  }

  //네이버로그인-passport 사용
  // @loginNaver() //스웨거전용커스텀데코레이터
  @Get('/login/passport/naver')
  @UseGuards(AuthGuard('naver'))
  async loginNaver(
    @CurrentUser() user: OauthPassportDto, //
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    return this.authService.loginOauthByPassport({ user });
  }
}
