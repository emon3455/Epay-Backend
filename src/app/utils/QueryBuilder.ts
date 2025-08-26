/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query } from "mongoose";
import { excludeField } from "../constants";


const toDayStart = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const toDayEnd   = (iso: string) => new Date(`${iso}T23:59:59.999Z`);

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const f: any = {};

    // copy allowed query keys as exact matches
    for (const key in this.query) {
      if (!excludeField.includes(key)) {
        f[key] = this.query[key];
      }
    }

    // map startDate/endDate -> createdAt range
    const { startDate, endDate } = this.query;
    if (startDate || endDate) {
      f.createdAt = {
        ...(startDate ? { $gte: toDayStart(startDate) } : {}),
        ...(endDate   ? { $lte: toDayEnd(endDate) } : {}),
      };
    }

    this.modelQuery = this.modelQuery.find(f);
    return this;
  }

  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm;

    if (!searchTerm) return this;

    const searchConditions = searchableFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));

    // merge with existing filters
    this.modelQuery = this.modelQuery.find({
      $and: [
        // take existing filter (already applied via filter())
        ...(this.modelQuery.getFilter() ? [this.modelQuery.getFilter()] : []),
        { $or: searchConditions },
      ],
    });

    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }
  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    const filter = this.modelQuery.getFilter(); // current query filters

    const totalDocuments = await this.modelQuery.model.countDocuments(filter);

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit);

    return { page, limit, total: totalDocuments, totalPage };
  }
}
