$(document).ready(function()
{
    $('.delete-tablet').click(function(e)
    {
        e.preventDefault();
        $target =  $(e.target);
        const id = $target.attr('id');
        $.ajax({
            method: "DELETE",
            url: "/delete/" + id,
            success: function(data)
            {
                alert(data);
                window.location.href = '/tablets/0';
            },  
            error: function(err)
            {
                console.log(err);
            }
        });
    });
});