namespace CricketBazar.Shared.Constants;

public static class ApiConstants
{
    public const string ApiVersion = "v1";
    public const string ApiBaseUrl = "/api/v1";

    public static class Messages
    {
        public const string Success = "Operation successful";
        public const string NotFound = "Resource not found";
        public const string BadRequest = "Invalid request";
        public const string Unauthorized = "Unauthorized access";
        public const string ServerError = "An error occurred while processing your request";
    }
}
