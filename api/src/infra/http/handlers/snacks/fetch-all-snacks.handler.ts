import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { FetchAllSnacksController } from '../../controllers/snacks/fetch-all-snacks.controller'
import { FetchAllSnacksUseCase } from '../../../../domain/use-cases/snacks/fetch-all-snacks'
import { PrismaSnacksRepository } from '../../../database/repositories/prisma-snacks-repository'
import { PrismaSnackIngredientsRepository } from '../../../database/repositories/prisma-snack-ingredients-repository'

export class FetchAllSnacksHandler {
  constructor(private fetchAllSnacksController: FetchAllSnacksController) {}

  public lambdaHandler = async (
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> => {
    const queryParams = JSON.stringify(event.queryStringParameters)
    const parsedParams = JSON.parse(queryParams)

    if (parsedParams) {
      parsedParams.page = Number(parsedParams.page)
      parsedParams.pageSize = Number(parsedParams.pageSize)
    }

    const snacks = await this.fetchAllSnacksController.handle(
      parsedParams ?? {},
    )

    return {
      statusCode: 200,
      body: JSON.stringify(snacks),
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Credentials': 'true',
      },
    } as APIGatewayProxyResult
  }
}

const snackIngredientsRepository = new PrismaSnackIngredientsRepository()
const snackRepository = new PrismaSnacksRepository(snackIngredientsRepository)
const getAllSnacksUseCase = new FetchAllSnacksUseCase(snackRepository)
const getAllSnacksController = new FetchAllSnacksController(getAllSnacksUseCase)

export const fetchAllSnacksHandler = new FetchAllSnacksHandler(
  getAllSnacksController,
).lambdaHandler
