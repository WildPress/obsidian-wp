export interface ObsidianWpSettings {
    blogUrl: string;
    username: string;
    applicationPassword: string;
    restPath: string;
}

export interface WpPost {
    [index: string]: any;

    title: string & {
        readonly rendered?: string
    };
    content: string;
    excerpt?: string;
    status?: string;
    tags?: Array<string | number>;
    categories?: Array<string | number>;
}