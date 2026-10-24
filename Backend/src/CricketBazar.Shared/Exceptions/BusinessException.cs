namespace CricketBazar.Shared.Exceptions;

public class BusinessException : Exception
{
    public string? Code { get; set; }

    public BusinessException(string message, string? code = null) : base(message)
    {
        Code = code;
    }
}
