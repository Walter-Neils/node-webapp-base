import { WithId } from "mongodb";
import { getMongoClient } from "../../data/MongoConnectionManager.js";
import { ALL_POSSIBLE_PATHS_MUST_BE_EXHAUSTIVELY_CHECKED_ON } from "../../misc/ExhaustiveCodePathChecking.js";

const client = getMongoClient();

const configurationDB = client.db('infastucture');

const configurationCollection = configurationDB.collection<ConfigurationDocument>('backend-configuration');

type ApplicatorTags = 'production' | 'development' | 'test' | string;

type ApplicationConfiguration = ({
    applicatorType: 'tags';
    tags: ApplicatorTags[];
} | {
    applicatorType: 'all';
} | {
    applicatorType: 'specificdevice';
    hostname: string;
}) & {
    precedence: number;
};

type ConfigurationDocument = {
    applicator: ApplicationConfiguration;
    key: string;
    value: any;
};

export class ConfigurationManager
{
    private hostname: string;
    private tags: ApplicatorTags[];

    private configurationDocuments: Promise<WithId<ConfigurationDocument>[]>;

    constructor(hostname: string, tags: ApplicatorTags[])
    {
        this.hostname = hostname;
        this.tags = tags;
        this.configurationDocuments = this.getConfigurationDocuments();
    }

    private async getConfigurationDocuments()
    {
        return await configurationCollection.find().toArray();
    }

    private isConfigurationDocumentRelevant(document: ConfigurationDocument)
    {
        const applicator = document.applicator;

        switch (applicator.applicatorType)
        {
            case 'tags':
                return applicator.tags.some(tag => this.tags.includes(tag));
            case 'all':
                return true;
            case 'specificdevice':
                return applicator.hostname === this.hostname;
        }

        ALL_POSSIBLE_PATHS_MUST_BE_EXHAUSTIVELY_CHECKED_ON(applicator);
    }

    private async getRelevantConfigurationDocuments()
    {
        const documents = await this.configurationDocuments;
        const filteredDocuments = documents.filter(document => this.isConfigurationDocumentRelevant(document));
        return filteredDocuments;
    }

    public async getConfigurationValue<T>(key: string)
    {
        const documents = await this.getRelevantConfigurationDocuments();
        const document = documents.find(document => document.key === key);

        if (document === undefined)
        {
            throw new Error(`No configuration document with key ${key}`);
        }

        return document.value as T;
    }

    public async addConfigurationValue<T>(key: string, value: T, configuration: ApplicationConfiguration)
    {
        const insertResult = await configurationCollection.insertOne({
            key,
            value,
            applicator: configuration
        });

        const result = await configurationCollection.findOne({
            _id: insertResult.insertedId
        });

        if (result === null)
        {
            throw new Error("Inserted document not found");
        }

        (await this.configurationDocuments).push(result);

        return value;
    }

    public async setConfigurationValue<T>(key: string, value: T)
    {
        const document = await this.getUnderlyingConfigurationValue(key);

        await configurationCollection.updateOne({
            _id: document._id
        }, {
            $set: {
                value
            }
        });

        document.value = value;

        return value;
    }

    private async getUnderlyingConfigurationValue<T>(key: string)
    {
        const documents = await this.getRelevantConfigurationDocuments();
        const document = documents.filter(document => document.key === key).sort((a, b) => b.applicator.precedence - a.applicator.precedence).pop();

        if (document === undefined)
        {
            throw new Error(`No configuration document with key ${key}`);
        }

        return document;
    }

    public async getConfigurationValueOrDefault<T>(key: string, defaultValue: T)
    {
        try
        {
            const value = await this.getConfigurationValue<T>(key);
            return value;
        }
        catch (e)
        {
            return defaultValue;
        }
    }
}