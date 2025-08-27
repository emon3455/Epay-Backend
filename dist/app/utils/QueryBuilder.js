"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
const constants_1 = require("../constants");
const toDayStart = (iso) => new Date(`${iso}T00:00:00.000Z`);
const toDayEnd = (iso) => new Date(`${iso}T23:59:59.999Z`);
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    filter() {
        const f = {};
        // copy allowed query keys as exact matches
        for (const key in this.query) {
            if (!constants_1.excludeField.includes(key)) {
                f[key] = this.query[key];
            }
        }
        // map startDate/endDate -> createdAt range
        const { startDate, endDate } = this.query;
        if (startDate || endDate) {
            f.createdAt = Object.assign(Object.assign({}, (startDate ? { $gte: toDayStart(startDate) } : {})), (endDate ? { $lte: toDayEnd(endDate) } : {}));
        }
        this.modelQuery = this.modelQuery.find(f);
        return this;
    }
    search(searchableFields) {
        const searchTerm = this.query.searchTerm;
        if (!searchTerm)
            return this;
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
    sort() {
        const sort = this.query.sort || "-createdAt";
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    fields() {
        var _a;
        const fields = ((_a = this.query.fields) === null || _a === void 0 ? void 0 : _a.split(",").join(" ")) || "";
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    build() {
        return this.modelQuery;
    }
    getMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = this.modelQuery.getFilter(); // current query filters
            const totalDocuments = yield this.modelQuery.model.countDocuments(filter);
            const page = Number(this.query.page) || 1;
            const limit = Number(this.query.limit) || 10;
            const totalPage = Math.ceil(totalDocuments / limit);
            return { page, limit, total: totalDocuments, totalPage };
        });
    }
}
exports.QueryBuilder = QueryBuilder;
