import { PrismaClient } from '@prisma/client';
import { Ingredient, UpdateIngredient } from '../../../domain/entities/ingredient';
import { IngredientsRepository } from '../../../domain/repositories/ingredients-repository';
import { PrismaIngredientMapper } from '../mappers/prisma-ingredient-mapper';

export class PrismaIngredientsRepository implements IngredientsRepository {
  constructor(private prisma = new PrismaClient()) {}

  async create(ingredient: Ingredient): Promise<void> {
    const data = PrismaIngredientMapper.toPrisma(ingredient);

    await this.prisma.ingredient.create({
      data,
    });
  }

  async findAll(): Promise<Ingredient[]> {
    const ingredients = await this.prisma.ingredient.findMany();

    return ingredients.map(PrismaIngredientMapper.toDomain);
  }

  async findById(id: string): Promise<Ingredient | null> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: {
        id,
      },
    });

    if (!ingredient) {
      return null;
    }

    return PrismaIngredientMapper.toDomain(ingredient);
  }

  async update(id: string, content: UpdateIngredient): Promise<void> {
    await this.prisma.ingredient.update({
      where: {
        id,
      },
      data: content,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ingredient.delete({
      where: {
        id,
      },
    });
  }
}
