import * as mongodb from 'mongodb';

export type ValueFetchOperator = '$first' | '$last' | '$max' | '$min' | '$avg' | '$push' | '$addToSet';

type SpecialFieldIdentifier = 'timestamp';

/**
 * MongoDB query builder
 */
export class QueryBuilder
{
    private _components: any[] = [];
    private specialFields: Map<SpecialFieldIdentifier, string> = new Map();

    public registerSpecialField(identifier: SpecialFieldIdentifier, field: string): QueryBuilder
    {
        this.specialFields.set(identifier, field);
        return this;
    }

    public select(...fields: string[]): QueryBuilder
    {
        let projection: any = {
            _id: 1
        };
        for (const field of fields)
        {
            projection[ field ] = 1;
        }
        this._components.push({ $project: projection });
        return this;
    }

    public exclude(...fields: string[]): QueryBuilder
    {
        let projection: any = {};
        for (const field of fields)
        {
            projection[ field ] = 0;
        }
        this._components.push({ $project: projection });
        return this;
    }

    public match(field: string, value: any): QueryBuilder
    {
        this._components.push({ $match: { [ field ]: value } });
        return this;
    }

    public rename(field: string, newField: string): QueryBuilder
    {
        this._components.push({ $addFields: { [ newField ]: `$${field}` } });
        this._components.push({ $project: { [ field ]: 0 } });
        return this;
    }

    public group(field: string, value: any, operator: ValueFetchOperator = "$first"): QueryBuilder
    {
        this._components.push({ $group: { _id: `$${field}`, [ field ]: { operator: `$${field}` } } });
        return this;
    }

    public treatFieldAsDate(field?: string): QueryBuilder
    {
        let target: string | null = null;
        if (field)
        {
            target = field;
        }
        else if (this.specialFields.has('timestamp'))
        {
            const timestampField = this.specialFields.get('timestamp');
            if (timestampField)
            {
                target = timestampField;
            }
            else
            {
                throw new Error('Timestamp field not registered');
            }
        }
        else
        {
            throw new Error('Unable to determine target field');
        }
        this._components.push({ $addFields: { [ target ]: { $toDate: `$${target}` } } });
        return this;
    }

    public sort(field: string, order: 1 | -1 = 1): QueryBuilder 
    {
        this._components.push({ $sort: { [ field ]: order } });
        return this;
    }

    public limit(limit: number): QueryBuilder
    {
        this._components.push({ $limit: limit });
        return this;
    }

    public constrainResultsToDateRange(from: Date, to: Date): QueryBuilder
    {
        const field = this.specialFields.get('timestamp');
        if (!field)
        {
            throw new Error('Timestamp field not registered');
        }
        this._components.push({ $match: { [ field ]: { $gte: from, $lt: to } } });
        return this;
    }

    public stripDBID(): QueryBuilder 
    {
        this._components.push({ $project: { _id: 0 } });
        return this;
    }

    public async execute(collection: mongodb.Collection): Promise<any[]>
    {
        return await collection.aggregate(this._components).toArray();
    }

    public get components(): any[]
    {
        return this._components;
    }
}