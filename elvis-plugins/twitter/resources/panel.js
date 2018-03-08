(function() {
  var elvisApi;
  var elvisContext;

  var selectedHits;
  var tagitOptions = {
    placeholderText: 'Add hastag...'
  };

  function renderTopics() {
    Util.callSocialApi(elvisApi, {
      type: 'GET',
      url: Util.BASE_URL,
      success: (response) => {
        var html = response.map((topic) => {
          return renderTopic(topic);
        }).join('');
        $('#watchedTopics').html(html);
      }
    });
  }

  function renderTopic(topicData) {
    var topicName = Util.escapeHtml(topicData.name);
    
    return `
      <div class="topic" data-topic="${topicName}">
        <div class="topicRead">
          <div class="topicHeader">
            <div class="topicName">${topicName}</div>
            <div class="topicActions">
              <a class="topicAction editTopic" href="#">E</a>
              <a class="topicAction deleteTopic" href="#">X</a>
            </div>
          </div>
          <div class="topicKeywords">${getKeywordString(topicData.keywords)}</div>
        </div>
        <div class="topicEdit" style="display:none">
          <div class="topicHeader">
            <div class="topicName">${topicName}</div>
          </div>
          <ul class="topicKeywordsEdit"></ul>
          <div class="buttons">
            <button class="basicBtn pale cancelButton">Cancel</button>
            <button class="basicBtn saveButton">Save</button>
          </div>
        </div>
      </div>
    `
  }

  function editTopic() {
    var topic = getTopicInfo($(this));
    console.log('Edit: ' + topic.name);
    
    // Update keyword editor
    var keyEditor = topic.keywordsEditEl;
    keyEditor.tagit(tagitOptions);
    keyEditor.tagit('removeAll');
    topic.keywordsEl.text().split(',').forEach((keyword) => {
      keyEditor.tagit('createTag', keyword.trim());
    });
    
    switchState(topic, 'edit');
  }

  function deleteTopic() {
    var topic = getTopicInfo($(this));
    console.log('Delete: ' + topic.name);

    if(confirm('Do you really want to stop watching "' + topic.name + '"?')) {
      Util.callSocialApi(elvisApi, {
        type: 'DELETE',
        url: Util.BASE_URL + '/' + topic.name,
        success: (response) => {
          topic.rootEl.remove();
        }
      });
    }
  }

  function cancelSave() {
    var topic = getTopicInfo($(this));
    console.log('Cancel: ' + topic.name);

    // Switch editor visibility
    switchState(topic, 'read');
  }

  function saveExistingTopic() {
    var topic = getTopicInfo($(this));
    console.log('Saving: ' + topic.name);
    var topicData = {
      name: topic.name,
      keywords: topic.keywordsEditEl.tagit('assignedTags')
    }
    if (!topicData.keywords) {
      alert('Please specify one or multiple topic keywords');
      topic.nameEl.focus();
      return;
    }

    // TODO: check for unique topic name 
    
    Util.callSocialApi(elvisApi, {
      type: 'PUT',
      url: Util.BASE_URL,
      data: JSON.stringify(topicData),
      success: (response) => {
        console.log('Topic ' + topicData.name + ' saved.');
        topic.keywordsEl.text(getKeywordString(topicData.keywords));
        switchState(topic, 'read');
      }
    });
  }

  function saveNewTopic() {
    console.log('Saving new topic...');
    var topicData = {
      name: $('#newTopicName').val(),
      keywords: $('#newTopicKeywords').tagit('assignedTags')
    }
    if (!topicData.name) {
      alert('Please specify a topic name');
      $('#newTopicName').focus();
      return;
    }
    if (!topicData.keywords) {
      alert('Please specify one or multiple topic keywords');
      $('#newTopicKeywords').focus();
      return;
    }

    // TODO: check for unique topic name 
   
    Util.callSocialApi(elvisApi, {
      type: 'PUT',
      url: Util.BASE_URL,
      data: JSON.stringify(topicData),
      success: (response) => {
        console.log('New topic ' + topicData.name + ' saved.');
        var topicHtml = renderTopic(topicData);
        $('#watchedTopics').prepend(topicHtml);
        resetNewTopic();
      }
    });
  }

  function resetNewTopic() {
    $('#newTopicName').val('');
    $('#newTopicKeywords').tagit('removeAll');
  }

  function getTopicInfo(context) {
    var topicElement = context.parents('.topic');
    return {
      name: topicElement.data().topic,
      rootEl: topicElement,
      readEl: topicElement.children('.topicRead'),
      nameEl: topicElement.find('.topicName'),
      keywordsEl: topicElement.find('.topicKeywords'),
      editEl: topicElement.children('.topicEdit'),
      keywordsEditEl: topicElement.find('.topicKeywordsEdit')
    };
  }

  function getKeywordString(keywords) {
    return Util.escapeHtml(keywords.join(', '));
  }

  function switchState(topic, newState) {
    topic.readEl.css('display', (newState === 'read') ? 'block' : 'none');
    topic.editEl.css('display', (newState === 'edit') ? 'block' : 'none');
  }

  function show(className) {
    $(className).css('display', 'flex');
  }

  function hide(className) {
    $(className).css('display', 'none');
  }

  /**
   * Initialize everything after DOM loaded
   */
  $(function () {
    elvisContext = ElvisPlugin.resolveElvisContext();
    // elvisContext.updateCallback = selectionUpdated;
    elvisApi = new ElvisAPI("${serverUrl}");
    
    $('#newTopicKeywords').tagit(tagitOptions);

    renderTopics();
    
    $('body').delegate('.resetNewButton', 'click', resetNewTopic);
    $('body').delegate('.saveNewButton', 'click', saveNewTopic);
    $('body').delegate('.editTopic', 'click', editTopic);
    $('body').delegate('.deleteTopic', 'click', deleteTopic);
    $('body').delegate('.cancelButton', 'click', cancelSave);
    $('body').delegate('.saveButton', 'click', saveExistingTopic);
     
    show('.watchesPanel');
  });
})();