import { FetchAllOrdersUseCase } from '../../../../domain/use-cases/orders/fetch-all-orders';
import { OrderDetailsPresenter } from '../../presenters/order-details-presenter';
import { BadRequest } from 'http-responses-ts';

export class FetchAllOrdersController {
  constructor(private createOrder: FetchAllOrdersUseCase) {}

  async handle() {
    const result = await this.createOrder.execute();

    if (result.isLeft()) {
      throw new BadRequest();
    }

    const orders = result.value.orders;

    return orders.map(OrderDetailsPresenter.toHTTP);
  }
}
