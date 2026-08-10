import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  ArchiveChronicleLocationUseCase,
} from '../application/archive-chronicle-location.use-case'

import {
  ChronicleLocationHierarchyCycleError,
  ChronicleLocationParentNotFoundError,
} from '../application/chronicle-location-hierarchy'

import {
  ChronicleLocationPermissionError,
} from '../application/chronicle-location-permission'

import {
  CreateChronicleLocationUseCase,
} from '../application/create-chronicle-location.use-case'

import {
  ListChronicleLocationsUseCase,
} from '../application/list-chronicle-locations.use-case'

import {
  LoadChronicleLocationUseCase,
} from '../application/load-chronicle-location.use-case'

import {
  ChronicleLocationNotFoundError,
  UpdateChronicleLocationUseCase,
} from '../application/update-chronicle-location.use-case'

import {
  InvalidChronicleLocationRequestError,
  parseChronicleLocationIdParam,
  parseCreateChronicleLocationRequest,
  parseUpdateChronicleLocationRequest,
  toChronicleLocationResponse,
} from './chronicle-location.dto'

import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'

import type {
  ChronicleLocationResponseDto,
} from './chronicle-location.dto'

interface AuthenticatedChronicleLocationRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedChronicleLocationRequest,
): string {
  try {
    return parseChronicleNarratorId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwChronicleLocationHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError ||
    error instanceof
      InvalidChronicleLocationRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_LOCATION_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleLocationPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_LOCATION_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleLocationParentNotFoundError
  ) {
    throw new BadRequestException({
      code:
        'CHRONICLE_LOCATION_PARENT_NOT_FOUND',
    })
  }

  if (
    error instanceof
      ChronicleLocationHierarchyCycleError
  ) {
    throw new BadRequestException({
      code:
        'CHRONICLE_LOCATION_HIERARCHY_CYCLE',
    })
  }

  if (
    error instanceof
      ChronicleLocationNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHRONICLE_LOCATION_NOT_FOUND',
    })
  }

  throw error
}

@Controller(
  'chronicles/:chronicleId/locations',
)
export class ChronicleLocationController {
  constructor(
    private readonly listLocations:
      ListChronicleLocationsUseCase,
    private readonly loadLocation:
      LoadChronicleLocationUseCase,
    private readonly createLocation:
      CreateChronicleLocationUseCase,
    private readonly updateLocation:
      UpdateChronicleLocationUseCase,
    private readonly archiveLocation:
      ArchiveChronicleLocationUseCase,
  ) {}

  @Get()
  async list(
    @Req() request:
      AuthenticatedChronicleLocationRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
  ): Promise<
    readonly ChronicleLocationResponseDto[]
  > {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      return (
        await this.listLocations.execute(
          actorUserId,
          chronicleId,
        )
      ).map(
        toChronicleLocationResponse,
      )
    } catch (error: unknown) {
      throwChronicleLocationHttpError(error)
    }
  }

  @Post()
  async create(
    @Req() request:
      AuthenticatedChronicleLocationRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleLocationResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      const data =
        parseCreateChronicleLocationRequest(
          chronicleId,
          body,
        )

      return toChronicleLocationResponse(
        await this.createLocation.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleLocationHttpError(error)
    }
  }

  @Get(':locationId')
  async detail(
    @Req() request:
      AuthenticatedChronicleLocationRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('locationId')
    locationIdInput: unknown,
  ): Promise<ChronicleLocationResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const locationId =
        parseChronicleLocationIdParam(
          locationIdInput,
        )

      const location =
        await this.loadLocation.execute(
          actorUserId,
          chronicleId,
          locationId,
        )

      if (location === null) {
        throw new ChronicleLocationNotFoundError(
          locationId,
        )
      }

      return toChronicleLocationResponse(
        location,
      )
    } catch (error: unknown) {
      throwChronicleLocationHttpError(error)
    }
  }

  @Patch(':locationId')
  async update(
    @Req() request:
      AuthenticatedChronicleLocationRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('locationId')
    locationIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleLocationResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const locationId =
        parseChronicleLocationIdParam(
          locationIdInput,
        )

      const data =
        parseUpdateChronicleLocationRequest(
          chronicleId,
          locationId,
          body,
        )

      return toChronicleLocationResponse(
        await this.updateLocation.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleLocationHttpError(error)
    }
  }

  @Patch(':locationId/archive')
  async archive(
    @Req() request:
      AuthenticatedChronicleLocationRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('locationId')
    locationIdInput: unknown,
  ): Promise<ChronicleLocationResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const locationId =
        parseChronicleLocationIdParam(
          locationIdInput,
        )

      return toChronicleLocationResponse(
        await this.archiveLocation.execute(
          actorUserId,
          chronicleId,
          locationId,
        ),
      )
    } catch (error: unknown) {
      throwChronicleLocationHttpError(error)
    }
  }
}
