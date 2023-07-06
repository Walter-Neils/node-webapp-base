import { IncomingMessage, ServerResponse } from "http";
import { getMongoDatabase, CommonDBIdentifier } from "../core/database/databaseConnectors.js";
import { QueryBuilder } from "../core/database/queryBuilder.js";
import { readBodyAsJSON } from "../core/request-response-helpers/bodyReaders.js";
import { Controller } from "../core/server/controller.js";
import { route } from "../core/server/server.js";

const mongoDatabase = await getMongoDatabase<CommonDBIdentifier>('ExampleTimeSeriesData');

export interface Metric
{
    label: string;
    value: string;
    payloads?: Payload[];
    handler: (payload: any, from: Date, to: Date) => Promise<any>;
}

export interface Payload
{
    label?: string;
    name: string;
    type: string;
    placeholder?: string;
    reloadMetric?: boolean;
    width?: number;
    options?: Option[];
}

export interface Option
{
    label: string;
    value: string;
}

const metrics: Metric[] = [];

class GrafanaDataController extends Controller
{
    // Path: /api/grafana
    @route({ pathRegex: /^\/api\/grafana/, methods: "GET" })
    public async GrafanaData(req: IncomingMessage, res: ServerResponse)
    {
        // Return 200 OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ message: 'Hello from GrafanaDataController' }));
        res.end();
    }

    // [POST] /api/grafana/metrics
    @route({ pathRegex: /^\/api\/grafana\/metrics/, methods: "POST" })
    public async GrafanaMetrics(req: IncomingMessage, res: ServerResponse)
    {
        // Return 200 OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(metrics));
        res.end();
    }

    // [POST] /metric-payload-options
    @route({ pathRegex: /^\/api\/grafana\/metric-payload-options/, methods: "POST" })
    public async GrafanaMetricPayloadOptions(req: IncomingMessage, res: ServerResponse)
    {
        const body = await readBodyAsJSON<any>(req);
        console.log(body);
        // Find the metric
        const metric = metrics.find(x => x.value === body.metric);
        if (!metric)
        {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: 'Bad Request' }));
            res.end();
            console.log(`[GrafanaDataController] [GrafanaMetricPayloadOptions] [${body.metric}] (body.metric) not found`);
            return;
        }

        // Find the payload
        const payload = metric.payloads?.find(x => x.name === body.name);
        if (!payload)
        {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: 'Bad Request' }));
            res.end();
            console.log(`[GrafanaDataController] [GrafanaMetricPayloadOptions] [${body.name}] (body.name) not found`);
            return;
        }

        // Get the options
        const options = payload.options;
        if (!options)
        {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: 'Bad Request' }));
            res.end();
            console.log(`[GrafanaDataController] [GrafanaMetricPayloadOptions] [${body.name}] (body.name options) options not found`);
            return;
        }

        // Return 200 OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(options));
        res.end();
        console.log(`[GrafanaDataController] [GrafanaMetricPayloadOptions] [${body.name}] options found`);
    }

    // [POST] /api/grafana/query
    @route({ pathRegex: /^\/api\/grafana\/query/, methods: "POST" })
    public async GrafanaQuery(req: IncomingMessage, res: ServerResponse)
    {
        this.liftResponseTimeRestriction(); // This could take a while
        res.setHeader('Cache-Control', 'public, max-age=0');

        const fullBody = (await readBodyAsJSON<any>(req));

        const target: string = fullBody.targets[ 0 ].target;
        const payload = fullBody.targets[ 0 ].payload;

        const metric = metrics.find(x => x.value === target);
        if (!metric)
        {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: 'Bad Request' }));
            res.end();
            console.log(`[GrafanaDataController] [GrafanaQuery] [${target}] (target) not found`);
            return;
        }

        try
        {
            const result = await metric.handler(payload, parseGrafanaDate(fullBody.range.from), parseGrafanaDate(fullBody.range.to));
            res.write(JSON.stringify(result));
        }
        catch (e: any)
        {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: 'Bad Request', error: e.message, payload: payload }));
        }
        res.end();
    }
}

/**
 * 
 * @param date Either a ISO8601 formatted date string with a zulu indicator at the end, or a Grafana-formatted 'now-3h' style date
 * @returns A 'Date' object equivalent to the input
 */
function parseGrafanaDate(date: string)
{
    // if it ends with 'Z' then it's already in UTC
    if (date.endsWith('Z'))
    {
        return new Date(date);
    }

    if (date === 'now')
    {
        return new Date();
    }

    // Otherwise it's in the format now-1h, now-1d, now-1w, now-1M
    const now = new Date();
    const number = parseInt(date.substr(4, date.length - 5));
    const unit = date.substr(date.length - 1, 1);

    switch (unit)
    {
        case 'h':
            return new Date(now.getTime() - (number * 60 * 60 * 1000));
        case 'd':
            return new Date(now.getTime() - (number * 24 * 60 * 60 * 1000));
        case 'w':
            return new Date(now.getTime() - (number * 7 * 24 * 60 * 60 * 1000));
        case 'M':
            return new Date(now.getTime() - (number * 30 * 24 * 60 * 60 * 1000));
        case 'y':
            return new Date(now.getTime() - (number * 365 * 24 * 60 * 60 * 1000));
        default:
            throw new Error(`Unknown unit: ${unit}`);
    }
}

/**
 * Reduces the data set to the nearest minuteInterval
 * @param data An array of objects
 * @param timestampField The field to use as the timestamp (must be a Date)
 * @param minuteInterval The interval to round to (default 5)
 */
function reduceDataSet(data: any[], timestampField: string, minuteInterval: number = 5)
{
    for (let i = 0; i < data.length; i++)
    {
        const item = data[ i ];
        const timestamp = new Date(item[ timestampField ]);
        const minute = timestamp.getMinutes();
        // Round to the nearest minuteInterval
        const roundedMinute = Math.round(minute / minuteInterval) * minuteInterval;
        timestamp.setMinutes(roundedMinute);
        timestamp.setSeconds(0);
        timestamp.setMilliseconds(0);
        item[ timestampField ] = timestamp.toISOString();
    }

    // Merge all items with the same timestamp
    // Numeric values are averaged
    // String values are included if they are the same, otherwise they are set to '[multiple-values]'

    for (let i = 0; i < data.length; i++)
    {
        const item = data[ i ];
        const timestamp = item[ timestampField ];
        const matchingItems = data.filter(x => x[ timestampField ] === timestamp);
        if (matchingItems.length >= 1)
        {
            const newItem: any = {};
            newItem[ timestampField ] = timestamp;
            const keys = new Set<string>();
            for (const matchingItem of matchingItems)
            {
                for (const key of Object.keys(matchingItem))
                {
                    keys.add(key);
                }
            }

            for (const key of keys)
            {
                if (key === timestampField)
                {
                    continue;
                }

                const matchingValues = matchingItems.map(x => x[ key ]);
                if (matchingValues.length > 0)
                {
                    const baseItem = matchingItems[ 0 ];
                    if (baseItem instanceof Number)
                    {
                        // Average the values
                        const sum = matchingValues.reduce((a, b) => a + b, 0);
                        newItem[ key ] = sum / matchingValues.length;
                    }
                    else
                    {
                        // If all values are the same, use that value, otherwise use '[multiple-values]'
                        const allValuesAreTheSame = matchingValues.every(x => x === matchingValues[ 0 ]);
                        if (allValuesAreTheSame)
                        {
                            newItem[ key ] = matchingValues[ 0 ];
                        }
                        else
                        {
                            newItem[ key ] = '[multiple-values]';
                        }
                    }
                }
            }

            // Remove the matching items
            for (const matchingItem of matchingItems)
            {
                const index = data.indexOf(matchingItem);
                if (index > -1)
                {
                    data.splice(index, 1);
                }
            }
            // Add the new item
            data.push(newItem);
        }
    }

    return data;
}

function formatDataResultAsGrafanaResult(data: any[], timestampField: string)
{
    const uniqueFields = new Set<string>();
    const result: any[] = [];
    for (const item of data)
    {
        for (const field of Object.keys(item))
        {
            uniqueFields.add(field);
        }
    }

    // Remove the timestamp field
    uniqueFields.delete(timestampField);

    for (const field of uniqueFields)
    {
        const fieldAddition: { target: string, datapoints: any[]; } = {
            target: field,
            datapoints: []
        };

        for (const item of data)
        {
            fieldAddition.datapoints.push(
                [ item[ field ], new Date(item[ timestampField ]).getTime() ]
            );
        }

        result.push(fieldAddition);
    }
    return result;
}
