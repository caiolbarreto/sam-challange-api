import { Either, right } from '../../../core/either';
import { UniqueEntityID } from '../../../core/unique-entity-id';
import { Order } from '../../entities/order';
import { OrderSnacks } from '../../entities/order-snacks';
import { OrderSnacksList } from '../../entities/order-snacks-list';
import { OrdersRepository } from '../../repositories/orders-repository';
import { SnacksRepository } from '../../repositories/snacks-repository';
import { IngredientsRepository } from '../../repositories/ingredients-repository';
import { NotFound } from 'http-responses-ts';

interface OrderDetails {
  snackId: string;
  quantity: number;
}

interface CreateOrderUseCaseRequest {
  date: Date;
  orderDetails: OrderDetails[];
}

type CreateOrderUseCaseResponse = Either<Error | NotFound, { order: Order }>;

export class CreateOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private snacksRepository: SnacksRepository,
    private ingredientsRepository: IngredientsRepository,
  ) {}

  async execute({ date, orderDetails }: CreateOrderUseCaseRequest): Promise<CreateOrderUseCaseResponse> {
    const order = Order.create({ date });

    const snacksPromises = Promise.all(
      orderDetails.map(async (snack) => {
        const snackEntity = await this.snacksRepository.findById(snack.snackId);

        if (!snackEntity) {
          throw new NotFound('Snack not found');
        }

        Promise.all(
          snackEntity.snackIngredients.getItems().map(async (snackIngredient) => {
            const ingredientEntity = await this.ingredientsRepository.findById(snackIngredient.ingredientId.toString());
            const requiredIngredients = snackIngredient.quantity * snack.quantity;

            if (!ingredientEntity) {
              throw new NotFound('Ingredient not found');
            }

            if (ingredientEntity.quantity < requiredIngredients) {
              throw new Error('Insufficient quantity of ingredient');
            }

            const currentIngredientQuantity = ingredientEntity.quantity - requiredIngredients;
            await this.ingredientsRepository.update(ingredientEntity.id.toString(), {
              quantity: currentIngredientQuantity,
            });
          }),
        );

        return { snackId: snack.snackId, quantity: snack.quantity };
      }),
    );

    const snacks = await snacksPromises;

    const orderSnacks = snacks.map((snack) =>
      OrderSnacks.create({
        orderId: order.id,
        snackId: new UniqueEntityID(snack.snackId),
        quantity: snack.quantity,
      }),
    );

    order.orderSnacks = new OrderSnacksList(orderSnacks);

    await this.ordersRepository.create(order);

    return right({ order });
  }
}
